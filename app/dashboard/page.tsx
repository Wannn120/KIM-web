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
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Customer dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Your match-day control center</h1>
          </div>
          <div className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">
            Welcome back, Ari
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <AnimatedCard key={stat.label}>
              <p className="text-sm text-[color:var(--muted)]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            </AnimatedCard>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <AnimatedCard className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Upcoming bookings</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Keep track of your next matches and arrivals.</p>
              </div>
              <a href="/booking-history" className="text-sm text-[color:var(--accent)]">View history →</a>
            </div>
            <div className="mt-6 space-y-4">
              {upcoming.map((item) => (
                <div key={item.field} className="flex items-center justify-between rounded-2xl border border-white/10 card-surface p-4">
                  <div>
                    <h3 className="font-semibold text-white">{item.field}</h3>
                    <p className="text-sm text-[color:var(--muted)]">{item.time}</p>
                  </div>
                  <span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-sm text-[color:var(--accent)]">{item.status}</span>
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
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 card-surface p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:rgba(16,185,129,0.12)] text-sm font-semibold text-[color:var(--accent)]">
                    {index + 1}
                  </div>
                  <span className="text-sm text-[color:var(--muted)]">{step}</span>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>
      </div>
    </main>
  );
}
