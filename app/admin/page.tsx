import { AnimatedCard } from "@/components/animated-card";
import { AdminContentEditor } from "@/components/admin-content-editor";
import { AdminReviewManager } from "@/components/admin-review-manager";
import { getAdminSummary } from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

const chartSeries = [
  { label: "Mon", value: 72 },
  { label: "Tue", value: 94 },
  { label: "Wed", value: 81 },
  { label: "Thu", value: 118 },
  { label: "Fri", value: 132 },
  { label: "Sat", value: 146 },
  { label: "Sun", value: 128 },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPage() {
  const summary = getAdminSummary();

  return (
    <main className="flex-1 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Owner / admin</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Operations command center</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
              Track revenue, demand patterns, field utilization, and customer activity from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/api/admin/export/excel" className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20">
              Export Excel
            </a>
            <a href="/api/admin/export/pdf" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">
              Export PDF
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AnimatedCard>
            <p className="text-sm text-slate-400">Revenue today</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(summary.revenueToday)}</p>
          </AnimatedCard>
          <AnimatedCard>
            <p className="text-sm text-slate-400">Revenue this month</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(summary.revenueThisMonth)}</p>
          </AnimatedCard>
          <AnimatedCard>
            <p className="text-sm text-slate-400">Bookings today</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.bookingsToday}</p>
          </AnimatedCard>
          <AnimatedCard>
            <p className="text-sm text-slate-400">Bookings this month</p>
            <p className="mt-2 text-3xl font-semibold text-white">{summary.bookingsThisMonth}</p>
          </AnimatedCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <AnimatedCard className="p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Revenue chart</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Weekly demand snapshot</h2>
              </div>
              <a href="/reports" className="text-sm text-cyan-300">Open reports →</a>
            </div>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="min-w-[560px] flex h-48 items-end gap-3">
                {chartSeries.map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-32 w-full items-end rounded-xl bg-slate-900/80 p-1">
                      <div className="w-full rounded-lg bg-gradient-to-t from-cyan-500 to-cyan-300" style={{ height: `${Math.max(point.value, 20)}%` }} />
                    </div>
                    <span className="text-xs text-slate-400">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-8">
            <h2 className="text-2xl font-semibold text-white">Peak hours</h2>
            <div className="mt-6 space-y-3">
              {summary.peakHours.map((slot) => (
                <div key={slot.hour} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  <span>{slot.hour}</span>
                  <span className="font-semibold text-cyan-300">{slot.bookings} bookings</span>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <AnimatedCard className="p-8">
            <h2 className="text-2xl font-semibold text-white">Most booked field</h2>
            <p className="mt-4 text-3xl font-semibold text-white">{summary.mostBookedField.name}</p>
            <p className="mt-2 text-sm text-slate-400">{summary.mostBookedField.bookings} bookings this month</p>
          </AnimatedCard>

          <AnimatedCard className="p-8">
            <h2 className="text-2xl font-semibold text-white">Customer statistics</h2>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <span>Total customers</span>
                <span className="font-semibold text-white">{summary.customerStats.totalCustomers}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <span>Active customers</span>
                <span className="font-semibold text-cyan-300">{summary.customerStats.activeCustomers}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                <span>New this month</span>
                <span className="font-semibold text-emerald-300">{summary.customerStats.newCustomersThisMonth}</span>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">Calendar</h2>
              <a href="/admin/calendar" className="text-sm text-cyan-300">View full →</a>
            </div>
            <div className="mt-6 space-y-3">
              {summary.calendarEvents.map((event) => (
                <div key={event.title} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">{event.title}</p>
                  <p className="mt-1 text-cyan-300">{event.date}</p>
                  <p className="mt-1 text-slate-400">{event.field}</p>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <AdminContentEditor />
          <AdminReviewManager />
        </div>
      </div>
    </main>
  );
}
