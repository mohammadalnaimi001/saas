import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui";
import type { CustomerProgress } from "../lib/types";

interface Redemption {
  id: string;
  created_at: string;
  reward_description: string;
  customers: { name: string } | null;
}

export default function Rewards() {
  const { business } = useAuth();
  const [ready, setReady] = useState<CustomerProgress[]>([]);
  const [log, setLog] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!business) return;
    (async () => {
      setLoading(true);
      const [progress, reds] = await Promise.all([
        supabase
          .from("customer_progress")
          .select("*")
          .eq("business_id", business.id),
        supabase
          .from("redemptions")
          .select("id, created_at, reward_description, customers(name)")
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      const rows = (progress.data as CustomerProgress[]) ?? [];
      setReady(
        rows
          .filter((r) => r.current_progress >= business.reward_threshold)
          .sort((a, b) => b.current_progress - a.current_progress)
      );
      setLog((reds.data as unknown as Redemption[]) ?? []);
      setLoading(false);
    })();
  }, [business]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Rewards</h1>
        <p className="mt-1 text-sm text-muted">
          Customers ready to redeem, and everything you've given out.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">
          Ready to redeem{" "}
          <span className="ml-1 chip bg-reward text-ink tnum">{ready.length}</span>
        </h2>
        {ready.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            No one's reached a reward yet. Keep stamping.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ready.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/app/customers/${r.id}`}
                  className="card flex items-center justify-between p-4 transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-reward/15 font-display font-bold text-reward-deep">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-ink">{r.name}</div>
                      <div className="font-mono text-xs text-muted">#{r.code}</div>
                    </div>
                  </div>
                  <span className="chip bg-reward text-ink">Redeem →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Redemption log</h2>
        {log.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            Nothing redeemed yet.
          </div>
        ) : (
          <div className="card divide-y divide-hairline">
            {log.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-reward/15 text-reward-deep">
                  ★
                </span>
                <div className="flex-1">
                  <span className="font-semibold text-ink">
                    {r.customers?.name ?? "Customer"}
                  </span>{" "}
                  <span className="text-muted">— {r.reward_description}</span>
                </div>
                <span className="text-xs text-muted">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
