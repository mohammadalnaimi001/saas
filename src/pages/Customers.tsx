import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Spinner, toast } from "../components/ui";
import type { CustomerProgress } from "../lib/types";

export default function Customers() {
  const { business } = useAuth();
  const [rows, setRows] = useState<CustomerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  async function load() {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase
      .from("customer_progress")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });
    setRows((data as CustomerProgress[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.phone ?? "").includes(term) ||
        r.code.toLowerCase().includes(term)
    );
  }, [rows, q]);

  const threshold = business?.reward_threshold ?? 8;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Customers</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} enrolled · search by name, phone, or code
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary">
          + New customer
        </button>
      </header>

      <input
        className="field"
        placeholder="Search customers…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="font-display text-lg font-bold">
            {rows.length === 0 ? "No customers yet" : "No matches"}
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            {rows.length === 0
              ? "Add your first customer and start stamping."
              : "Try a different name, phone, or code."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => {
            const ready = c.current_progress >= threshold;
            return (
              <li key={c.id}>
                <Link
                  to={`/app/customers/${c.id}`}
                  className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-lift"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-lg font-bold text-brand-600">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-ink">
                        {c.name}
                      </span>
                      {ready && (
                        <span className="chip bg-reward text-ink">Reward ready</span>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-muted">
                      #{c.code}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                      <div
                        className={`h-full rounded-full ${
                          ready ? "bg-reward" : "bg-brand-400"
                        }`}
                        style={{
                          width: `${Math.min(100, (c.current_progress / threshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold tnum text-muted">
                    {c.current_progress}/{threshold}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <AddCustomerModal
          businessId={business!.id}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            toast("Customer added");
            load();
          }}
        />
      )}
    </div>
  );
}

function AddCustomerModal({
  businessId,
  onClose,
  onAdded,
}: {
  businessId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setErr("A name is required.");
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from("customers")
      .insert({ business_id: businessId, name: name.trim(), phone: phone.trim() || null });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold">New customer</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="cname">
              Name
            </label>
            <input
              id="cname"
              className="field"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          </div>
          <div>
            <label className="label" htmlFor="cphone">
              Phone (optional)
            </label>
            <input
              id="cphone"
              className="field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="077 562 9874"
            />
          </div>
          {err && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button onClick={save} disabled={busy} className="btn-primary flex-1">
              {busy ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
