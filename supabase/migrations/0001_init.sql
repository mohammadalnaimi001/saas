-- =====================================================================
-- Stamply — initial schema
-- Multi-tenant loyalty & rewards platform.
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------

-- A tenant. One business = one loyalty program.
create table if not exists public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text unique,
  reward_threshold    int  not null default 8 check (reward_threshold between 2 and 50),
  reward_description   text not null default 'A free item on the house',
  brand_color         text not null default '#473C6B',
  created_by          uuid not null references auth.users (id) on delete cascade,
  created_at          timestamptz not null default now()
);

-- Maps an auth user to the business they work for.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  business_id  uuid references public.businesses (id) on delete set null,
  role         text not null default 'owner' check (role in ('owner', 'staff')),
  created_at   timestamptz not null default now()
);

-- An enrolled customer of a business.
create table if not exists public.customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null,
  phone        text,
  -- short code staff type at the counter; card_token is the QR/public link secret
  code         text not null default upper(substring(replace(gen_random_uuid()::text, '-', '') for 6)),
  card_token   uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  unique (business_id, code),
  unique (card_token)
);

-- One row per stamp issued.
create table if not exists public.stamp_events (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  customer_id  uuid not null references public.customers (id) on delete cascade,
  issued_by    uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- One row per reward redeemed. stamps_used freezes the threshold at redemption time.
create table if not exists public.redemptions (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  customer_id  uuid not null references public.customers (id) on delete cascade,
  redeemed_by  uuid references auth.users (id) on delete set null,
  stamps_used  int  not null,
  reward_description text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_customers_business on public.customers (business_id);
create index if not exists idx_stamp_events_customer on public.stamp_events (customer_id);
create index if not exists idx_stamp_events_business_time on public.stamp_events (business_id, created_at);
create index if not exists idx_redemptions_customer on public.redemptions (customer_id);
create index if not exists idx_redemptions_business_time on public.redemptions (business_id, created_at);

-- ---------------------------------------------------------------------
-- 2. HELPER: the caller's business id (from their profile)
-- ---------------------------------------------------------------------
create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 3. PROGRESS VIEW (RLS of underlying tables applies — security invoker)
-- ---------------------------------------------------------------------
create or replace view public.customer_progress
with (security_invoker = true) as
select
  c.id,
  c.business_id,
  c.name,
  c.phone,
  c.code,
  c.card_token,
  c.created_at,
  coalesce(s.total_stamps, 0)                          as total_stamps,
  coalesce(r.stamps_used, 0)                            as stamps_used,
  coalesce(s.total_stamps, 0) - coalesce(r.stamps_used, 0) as current_progress,
  coalesce(r.reward_count, 0)                          as rewards_earned,
  s.last_stamp_at
from public.customers c
left join (
  select customer_id, count(*) as total_stamps, max(created_at) as last_stamp_at
  from public.stamp_events group by customer_id
) s on s.customer_id = c.id
left join (
  select customer_id, sum(stamps_used) as stamps_used, count(*) as reward_count
  from public.redemptions group by customer_id
) r on r.customer_id = c.id;

-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.businesses   enable row level security;
alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.stamp_events enable row level security;
alter table public.redemptions  enable row level security;

-- profiles: a user reads & updates only their own profile.
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert with check (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid());

-- businesses: members read their business; creator inserts; members update.
create policy "members read business" on public.businesses
  for select using (id = public.current_business_id());
create policy "create own business" on public.businesses
  for insert with check (created_by = auth.uid());
create policy "members update business" on public.businesses
  for update using (id = public.current_business_id());

-- customers / stamp_events / redemptions: confined to the caller's business.
create policy "tenant customers" on public.customers
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "tenant stamps" on public.stamp_events
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "tenant redemptions" on public.redemptions
  for all using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- ---------------------------------------------------------------------
-- 5. AUTO-CREATE A PROFILE WHEN A USER SIGNS UP
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 6. ONBOARDING: create a business and attach the caller as owner
-- ---------------------------------------------------------------------
create or replace function public.create_business(
  p_name text,
  p_threshold int default 8,
  p_reward text default 'A free item on the house',
  p_color text default '#473C6B'
)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz public.businesses;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substring(replace(gen_random_uuid()::text, '-', '') for 4);

  insert into public.businesses (name, slug, reward_threshold, reward_description, brand_color, created_by)
  values (p_name, v_slug, p_threshold, p_reward, p_color, auth.uid())
  returning * into v_biz;

  update public.profiles
    set business_id = v_biz.id, role = 'owner'
    where id = auth.uid();

  return v_biz;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. ADD A STAMP (atomic, tenant-checked)
-- ---------------------------------------------------------------------
create or replace function public.add_stamp(p_customer_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz uuid := public.current_business_id();
  v_threshold int;
  v_progress int;
begin
  if v_biz is null then raise exception 'No business for user'; end if;

  -- ownership check
  if not exists (select 1 from public.customers where id = p_customer_id and business_id = v_biz) then
    raise exception 'Customer not found for this business';
  end if;

  insert into public.stamp_events (business_id, customer_id, issued_by)
  values (v_biz, p_customer_id, auth.uid());

  select reward_threshold into v_threshold from public.businesses where id = v_biz;

  select coalesce((select count(*) from public.stamp_events where customer_id = p_customer_id), 0)
       - coalesce((select sum(stamps_used) from public.redemptions where customer_id = p_customer_id), 0)
    into v_progress;

  return json_build_object(
    'current_progress', v_progress,
    'threshold', v_threshold,
    'reward_ready', v_progress >= v_threshold
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 8. REDEEM A REWARD (atomic, tenant-checked, eligibility-checked)
-- ---------------------------------------------------------------------
create or replace function public.redeem_reward(p_customer_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz uuid := public.current_business_id();
  v_threshold int;
  v_reward text;
  v_progress int;
begin
  if v_biz is null then raise exception 'No business for user'; end if;

  if not exists (select 1 from public.customers where id = p_customer_id and business_id = v_biz) then
    raise exception 'Customer not found for this business';
  end if;

  select reward_threshold, reward_description into v_threshold, v_reward
    from public.businesses where id = v_biz;

  select coalesce((select count(*) from public.stamp_events where customer_id = p_customer_id), 0)
       - coalesce((select sum(stamps_used) from public.redemptions where customer_id = p_customer_id), 0)
    into v_progress;

  if v_progress < v_threshold then
    raise exception 'Not enough stamps to redeem (% of %)', v_progress, v_threshold;
  end if;

  insert into public.redemptions (business_id, customer_id, redeemed_by, stamps_used, reward_description)
  values (v_biz, p_customer_id, auth.uid(), v_threshold, v_reward);

  return json_build_object(
    'redeemed', true,
    'current_progress', v_progress - v_threshold,
    'reward_description', v_reward
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 9. PUBLIC CARD LOOKUP (no login — keyed by the secret card_token)
-- ---------------------------------------------------------------------
create or replace function public.get_card(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v json;
begin
  select json_build_object(
    'customer_name', c.name,
    'business_name', b.name,
    'brand_color', b.brand_color,
    'reward_description', b.reward_description,
    'threshold', b.reward_threshold,
    'current_progress',
        coalesce((select count(*) from public.stamp_events where customer_id = c.id), 0)
      - coalesce((select sum(stamps_used) from public.redemptions where customer_id = c.id), 0),
    'rewards_earned',
        coalesce((select count(*) from public.redemptions where customer_id = c.id), 0)
  )
  into v
  from public.customers c
  join public.businesses b on b.id = c.business_id
  where c.card_token = p_token;

  if v is null then raise exception 'Card not found'; end if;
  return v;
end;
$$;

-- Allow anonymous + authenticated callers to read a card by token.
grant execute on function public.get_card(uuid) to anon, authenticated;
grant execute on function public.create_business(text, int, text, text) to authenticated;
grant execute on function public.add_stamp(uuid) to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.current_business_id() to authenticated;
