import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Spinner, toast } from "../components/ui";
import PunchCard from "../components/PunchCard";
import type { CustomerProgress } from "../lib/types";

interface HistoryRow {
  kind: "stamp" | "redeem";
  created_at: string;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { business } = useAuth();
  const [c, setC] = useState<CustomerProgress | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [animateIndex, setAnimateIndex] = useState<number | null>(null);

  const threshold = business?.reward_threshold ?? 8;
  const cardUrl = c ? `${window.location.origin}/card/${c.card_token}` : "";

  const loadHistory = useCallback(async (customerId: string) => {
    const [stamps, reds] = await Promise.all([
      supabase
        .from("stamp_events")
        .select("created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("redemptions")
        .select("created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);
    const rows: HistoryRow[] = [
      ...((stamps.data as { created_at: string }[]) ?? []).map((s) => ({
        kind: "stamp" as const,
        created_at: s.created_at,
      })),
      ...((reds.data as { created_at: string }[]) ?? []).map((r) => ({
        kind: "redeem" as const,
        created_at: r.created_at,
      })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setHistory(rows.slice(0, 15));
  }, []);

  const load = useCallback(async () => {
    if (!id || !business) return;
    setLoading(true);
    const { data } = await supabase
      .from("customer_progress")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setC((data as CustomerProgress) ?? null);
    if (data) await loadHistory(id);
    setLoading(false);
  }, [id, business, loadHistory]);

  useEffect(() => {
    load();
  }, [load]);

  async function addStamp() {
    if (!c || busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("add_stamp", {
      p_customer_id: c.id,
    });
    setBusy(false);
    if (error) {
      toast(error.message, "err");
      return;
    }
    const res = data as { current_progress: number; reward_ready: boolean };
    const filledNow = Math.min(res.current_progress, threshold);
    setAnimateIndex(filledNow - 1);
    setC({ ...c, current_progress: res.current_progress, total_stamps: c.total_stamps + 1 });
    setTimeout(() => setAnimateIndex(null), 500);
    if (res.reward_ready) {
      toast("Reward unlocked! 🎉");
    } else {
      toast("Stamp added");
    }
    loadHistory(c.id);
  }

  async function redeem() {
    if (!c || busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_reward", {
      p_customer_id: c.id,
    });
    setBusy(false);
    if (error) {
      toast(error.message, "err");
      return;
    }
    const res = data as { current_progress: number };
    setC({
      ...c,
      current_progress: res.current_progress,
      rewards_earned: c.rewards_earned + 1,
    });
    toast("Reward redeemed 🎁");
    loadHistory(c.id);
  }

  function copyLink() {
    navigator.clipboard.writeText(cardUrl).then(() => toast("Card link copied"));
  }

  if (loading) return <Spinner />;
  if (!c)
    return (
      <div className="card p-12 text-center">
        <p className="font-display text-lg font-bold">Customer not found</p>
        <Link to="/app/customers" className="btn-outline mt-4">
          Back to customers
        </Link>
      </div>
    );

  const ready = c.current_progress >= threshold;

  return (
    <div className="space-y-6">
      <Link to="/app/customers" className="text-sm font-semibold text-muted hover:text-ink">
        ← Customers
      </Link>

      <header className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 font-display text-2xl font-bold text-brand-600">
          {c.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{c.name}</h1>
          <div className="mt-0.5 flex items-center gap-3 text-sm text-muted">
            <span className="font-mono">#{c.code}</span>
            {c.phone && <span>{c.phone}</span>}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Card + actions */}
        <section className="space-y-5 lg:col-span-3">
          <PunchCard
            filled={c.current_progress}
            threshold={threshold}
            animateIndex={animateIndex}
            size="lg"
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={addStamp}
              disabled={busy}
              className="btn-primary flex-1 py-3 text-base"
            >
              + Add a stamp
            </button>
            <button
              onClick={redeem}
              disabled={busy || !ready}
              className="btn-reward flex-1 py-3 text-base"
            >
              {ready ? `Redeem: ${business?.reward_description}` : "Reward not ready"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Mini label="Lifetime stamps" value={c.total_stamps} />
            <Mini label="Rewards earned" value={c.rewards_earned} />
            <Mini label="Toward next" value={`${c.current_progress}/${threshold}`} />
          </div>
        </section>

        {/* QR card */}
        <section className="card flex flex-col items-center p-6 lg:col-span-2">
          <h2 className="self-start font-display text-lg font-bold">Their card</h2>
          <p className="self-start text-sm text-muted">
            Scan to view their progress on their phone.
          </p>
          <div className="my-5 rounded-xl2 border border-hairline bg-white p-4">
            <QRCodeSVG value={cardUrl} size={150} fgColor="#1E1B2E" level="M" />
          </div>
          <button onClick={copyLink} className="btn-outline w-full">
            Copy card link
          </button>
        </section>
      </div>

      {/* History */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold">History</h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No stamps yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {history.map((h, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    h.kind === "stamp"
                      ? "bg-brand-50 text-brand-600"
                      : "bg-reward/15 text-reward-deep"
                  }`}
                >
                  {h.kind === "stamp" ? "+1" : "★"}
                </span>
                <span className="flex-1">
                  {h.kind === "stamp" ? "Stamp added" : "Reward redeemed"}
                </span>
                <span className="text-xs text-muted">
                  {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-3">
      <div className="font-display text-xl font-bold tnum">{value}</div>
      <div className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
