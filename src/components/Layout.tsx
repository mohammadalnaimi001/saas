import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "./ui";
import { APP } from "../lib/supabase";

const nav = [
  { to: "/app", label: "Dashboard", icon: GridIcon, end: true },
  { to: "/app/customers", label: "Customers", icon: PeopleIcon },
  { to: "/app/rewards", label: "Rewards", icon: GiftIcon },
  { to: "/app/settings", label: "Settings", icon: GearIcon },
];

export default function Layout() {
  const { business, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <BrandMark />
          <span className="font-display text-xl font-bold tracking-tight">
            {APP.name}
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted hover:bg-brand-50/60 hover:text-ink"
                }`
              }
            >
              <n.icon />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-hairline p-4">
          <div className="truncate text-sm font-semibold text-ink">
            {business?.name ?? "—"}
          </div>
          <div className="truncate text-xs text-muted">{profile?.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="btn-ghost mt-3 w-full justify-start px-3 text-muted"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="flex items-center justify-between border-b border-hairline bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="font-display text-lg font-bold">{APP.name}</span>
        </div>
        <span className="max-w-[50%] truncate text-sm font-semibold text-muted">
          {business?.name}
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 pb-24 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hairline bg-white/95 backdrop-blur lg:hidden">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold ${
                isActive ? "text-brand-700" : "text-muted"
              }`
            }
          >
            <n.icon />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
      <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity=".5" />
      <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity=".5" />
      <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
    </svg>
  );
}
function PeopleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" fill="currentColor" />
      <path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" fill="currentColor" />
      <circle cx="17" cy="9" r="2.4" fill="currentColor" opacity=".5" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="9" width="18" height="11" rx="2" fill="currentColor" opacity=".5" />
      <rect x="3" y="9" width="18" height="4" rx="1" fill="currentColor" />
      <path d="M12 9v11" stroke="#fff" strokeWidth="1.6" />
      <path d="M12 9c-3-5-7-2-3 0M12 9c3-5 7-2 3 0" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      <path
        d="M12 2.5l1.4 2.3 2.6-.5.5 2.6 2.3 1.4-1.2 2.4 1.2 2.4-2.3 1.4-.5 2.6-2.6-.5L12 21.5l-1.4-2.3-2.6.5-.5-2.6-2.3-1.4 1.2-2.4-1.2-2.4 2.3-1.4.5-2.6 2.6.5z"
        fill="currentColor"
        opacity=".4"
      />
    </svg>
  );
}
