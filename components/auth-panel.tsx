import type { ReactNode } from "react";

interface AuthPanelProps {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
}

export function AuthPanel({ eyebrow, title, description, features }: AuthPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[color:var(--surface-strong)] p-8 shadow-2xl shadow-[0_20px_80px_rgba(16,185,129,0.08)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">{description}</p>
      <div className="mt-8 space-y-3 text-sm text-[color:var(--muted)]">
        {features.map((feature) => (
          <div key={feature} className="rounded-2xl border border-[color:rgba(16,185,129,0.12)] bg-[color:rgba(16,185,129,0.06)] p-4">
            {feature}
          </div>
        ))}
      </div>
    </section>
  );
}
