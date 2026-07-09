import { AnimatedCard } from "@/components/animated-card";

const history = [
  { id: "BK-1024", field: "Elite Turf 1", date: "07 Jul 2026", amount: "Rp 170.000", status: "Confirmed" },
  { id: "BK-1018", field: "Club Arena", date: "04 Jul 2026", amount: "Rp 220.000", status: "Completed" },
  { id: "BK-1009", field: "Elite Turf 2", date: "01 Jul 2026", amount: "Rp 150.000", status: "Cancelled" },
];

export const dynamic = "force-dynamic";

export default function BookingHistoryPage() {
  return (
    <main className="flex-1 bg-[color:var(--background)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking history</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Your complete booking timeline</h1>
            </div>
            <button className="rounded-full border border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.06)] px-4 py-2 text-sm text-[color:var(--accent)]">Export</button>
          </div>

          <div className="mt-8">
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-[640px] w-full table-auto text-left text-sm text-[color:var(--muted)]">
                <thead className="bg-[color:rgba(0,0,0,0.28)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-t border-white/10 bg-[color:rgba(15,23,42,0.08)]">
                      <td className="px-4 py-3 text-[color:var(--foreground)]">{item.id}</td>
                      <td className="px-4 py-3">{item.field}</td>
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.amount}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[color:var(--accent)]">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 card-surface p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[color:var(--muted)]">Booking ID</p>
                      <p className="font-semibold text-white">{item.id}</p>
                    </div>
                    <span className="rounded-full bg-[color:rgba(16,185,129,0.12)] px-3 py-1 text-[color:var(--accent)] text-sm">{item.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[color:var(--muted)]">
                    <div>
                      <p className="text-xs text-[color:var(--muted)]">Field</p>
                      <p className="text-sm text-white">{item.field}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[color:var(--muted)]">Date</p>
                      <p className="text-sm text-white">{item.date}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-[color:var(--muted)]">Amount</p>
                      <p className="text-sm text-white">{item.amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
