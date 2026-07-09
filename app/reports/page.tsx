import { AnimatedCard } from "@/components/animated-card";

const metrics = [
  { label: "Occupancy", value: "82%" },
  { label: "Revenue", value: "Rp 18.4M" },
  { label: "Repeat customers", value: "63%" },
  { label: "No-show rate", value: "4%" },
];

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Reports</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Performance insights</h1>
            </div>
            <button className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">Export CSV</button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
