import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect x="2" y="2" width="36" height="36" rx="11" fill="#473C6B" />
        <circle cx="20" cy="20" r="9" fill="none" stroke="#E8A33D" strokeWidth="3" />
        <path
          d="M15 20.5l3.4 3.4L26 16.3"
          fill="none"
          stroke="#E8A33D"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card animate-fadeUp p-5">
      <div className="label">{label}</div>
      <div
        className={`mt-1 font-display text-3xl font-bold tnum ${
          accent ? "text-reward-deep" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ---- Toast: a tiny module-level pub/sub ----
type ToastMsg = { msg: string; tone: "ok" | "err" };
let listeners: ((t: ToastMsg) => void)[] = [];

export function toast(msg: string, tone: "ok" | "err" = "ok") {
  listeners.forEach((fn) => fn({ msg, tone }));
}

export function ToastHost() {
  const [current, setCurrent] = useState<ToastMsg | null>(null);

  useEffect(() => {
    const fn = (t: ToastMsg) => setCurrent(t);
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(() => setCurrent(null), 2600);
    return () => clearTimeout(id);
  }, [current]);

  if (!current) return null;
  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className={`animate-fadeUp rounded-full px-5 py-3 text-sm font-semibold shadow-lift ${
          current.tone === "ok" ? "bg-ink text-white" : "bg-red-600 text-white"
        }`}
      >
        {current.msg}
      </div>
    </div>
  );
}
