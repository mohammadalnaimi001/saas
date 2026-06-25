import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, subDays, startOfDay, format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Spinner, StatTile } from "../components/ui";
import type { CustomerProgress, ActivityRow } from "../lib/types";

export default function Dashboard() {
  const { business } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CustomerProgress[]>([]);
  const [stampDays, setStampDays] = useState<{ day: string; count: number }[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    if (!business) return;
    let active = true;

    (async () => {
      setLoading(true);
      const since = subDays(startOfDay(new Date()), 13).toISOString();

      const [progress, stamps, reds] = await Promise.all([
        supabase
          .from("customer_progress")
          .select("*")
          .eq("business_id", business.id),
        supabase
          .from("stamp_events")
          .select("created_at, customer_id, customers(name)")
          .eq("business_id", business.id)
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
        supabase
          .from("redemptions")
          .select("created_at, customers(name)")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (!active) return;

      setRows((progress.data as CustomerProgress[]) ?? []);

      // 14-day trend buckets
      const buckets = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        buckets.set(d, 0);
      }
      ((stamps.data as { created_at: string }[]) ?? []).forEach((s) => {
        const d = format(new Date(s.created_at), "yyyy-MM-dd");
        if (buckets.has(d)) buckets.set(d, (buckets.get(d) ?? 0) + 1);
      });
      setStampDays(
        Array.from(buckets.entries()).map(([day, count]) => ({ day, count }))
      );

      // merge recent activity
      type Named = { created_at: string; customers?: { name?: string } | null };
      const sa: ActivityRow[] = ((stamps.data as Named[]) ?? [])
        .slice(0, 20)
        .map((s) => ({
          kind: "stamp",
          customer_name: s.customers?.name ?? "Customer",
          created_at: s.created_at,
        }));
      const ra: ActivityRow[] = ((reds.data as Named[]) ?? []).map((r) => ({
        kind: "redeem",
        customer_name: r.customers?.name ?? "Customer",
        created_at: r.created_at,
      }));
      setActivity(
        [...sa, ...ra]
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .slice(0, 12)
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [business]);

  const stats = useMemo(() => {
    const threshold = business?.reward_threshold ?? 8;
    const totalStamps = rows.reduce((a, r) => a + r.total_stamps, 0);
    const rewardsEarned = rows.reduce((a, r) => a + r.rewards_earned, 0);
    const readyNow = rows.filter((r) => r.current_progress >= threshold).length;
    return {
      customers: rows.length,
      totalStamps,
      rewardsEarned,
      readyNow,
    };
  }, [rows, business]);

  if (loading) return <Spinner label="Crunching your numbers…" />;

  const maxDay = Math.max(1, ...stampDays.map((d) => d.count));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            How {business?.name} is doing over the last two weeks.
          </p>
        </div>
        <Link to="/app/customers" className="btn-primary">
          + Add a stamp
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Customers" value={stats.customers} />
        <StatTile label="Stamps issued" value={stats.totalStamps} />
        <StatTile label="Rewards given" value={stats.rewardsEarned} />
        <StatTile label="Reward-ready now" value={stats.readyNow} accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Trend */}
        <section className="card p-6 lg:col-span-3">
          <h2 className="font-display text-lg font-bold">Stamps per day</h2>
          <p className="text-sm text-muted">Last 14 days</p>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {stampDays.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand-500 transition-all group-hover:bg-brand-600"
                    style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 4 : 0 }}
                    title={`${d.count} stamps`}
                  />
                </div>
                <span className="text-[0.6rem] text-muted tnum">
                  {format(new Date(d.day), "d")}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Activity */}
        <section className="card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              No activity yet. Add your first customer to get going.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      a.kind === "stamp"
                        ? "bg-brand-50 text-brand-600"
                        : "bg-reward/15 text-reward-deep"
                    }`}
                  >
                    {a.kind === "stamp" ? "+1" : "★"}
                  </span>
                  <span className="flex-1 truncate">
                    <span className="font-semibold text-ink">{a.customer_name}</span>{" "}
                    <span className="text-muted">
                      {a.kind === "stamp" ? "earned a stamp" : "redeemed a reward"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
