import type { ReactNode } from "react";
import { BrandMark } from "../components/ui";
import { APP } from "../lib/supabase";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-700 lg:block">
        <div className="absolute inset-0 opacity-[0.12]">
          {/* a faint field of stamps */}
          <div className="grid h-full grid-cols-6 gap-6 p-10">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-full border-2 border-reward"
              />
            ))}
          </div>
        </div>
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-2xl font-bold">{APP.name}</span>
          </div>
          <div>
            <h1 className="max-w-sm font-display text-4xl font-bold leading-tight">
              {APP.tagline}
            </h1>
            <p className="mt-4 max-w-sm text-brand-100">
              Run a digital punch card for your shop. Add stamps at the counter,
              hand out rewards, and watch regulars turn into loyal ones.
            </p>
          </div>
          <div className="text-sm text-brand-200">
            Stamp. Reward. Repeat.
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="font-display text-2xl font-bold">{APP.name}</span>
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center text-sm text-muted">{footer}</div>
        </div>
      </div>
    </div>
  );
}
