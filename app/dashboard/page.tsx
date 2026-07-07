import { AnimatedCard } from "@/components/animated-card";

const stats = [
  { label: "Upcoming bookings", value: "6" },
  { label: "Favorite fields", value: "3" },
  { label: "Rewards", value: "180 pts" },
  { label: "Spent this month", value: "Rp 1.2M" },
];

const upcoming = [
  { field: "Elite Turf 1", time: "Today • 19:00", status: "Confirmed" },
  { field: "Club Arena", time: "Tomorrow • 20:00", status: "Pending" },
];

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Customer dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Your match-day control center</h1>
          </div>
          <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            Welcome back, Ari
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <AnimatedCard key={stat.label}>
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </AnimatedCard>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <AnimatedCard className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Upcoming bookings</h2>
                <p className="mt-2 text-sm text-slate-400">Keep track of your next matches and arrivals.</p>
              </div>
              <a href="/booking-history" className="text-sm text-cyan-300">View history →</a>
            </div>
            <div className="mt-6 space-y-4">
              {upcoming.map((item) => (
                <div key={item.field} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.field}</h3>
                    <p className="text-sm text-slate-400">{item.time}</p>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm text-cyan-300">{item.status}</span>
                </div>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-8">
            <h2 className="text-2xl font-semibold text-white">Booking flow</h2>
            <div className="mt-6 space-y-4">
              {[
                "Choose field",
                "Pick time",
                "Checkout and pay",
                "Get confirmation",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                    {index + 1}
                  </div>
                  <span className="text-sm text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>
      </div>
    </main>
  );
}
