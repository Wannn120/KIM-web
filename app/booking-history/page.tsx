import { AnimatedCard } from "@/components/animated-card";

const history = [
  { id: "BK-1024", field: "Elite Turf 1", date: "07 Jul 2026", amount: "Rp 170.000", status: "Confirmed" },
  { id: "BK-1018", field: "Club Arena", date: "04 Jul 2026", amount: "Rp 220.000", status: "Completed" },
  { id: "BK-1009", field: "Elite Turf 2", date: "01 Jul 2026", amount: "Rp 150.000", status: "Cancelled" },
];

export const dynamic = "force-dynamic";

export default function BookingHistoryPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Booking history</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Your complete booking timeline</h1>
            </div>
            <button className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">Export</button>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400">
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
                  <tr key={item.id} className="border-t border-white/10 bg-slate-900/40">
                    <td className="px-4 py-3 text-white">{item.id}</td>
                    <td className="px-4 py-3">{item.field}</td>
                    <td className="px-4 py-3">{item.date}</td>
                    <td className="px-4 py-3">{item.amount}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-300">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
