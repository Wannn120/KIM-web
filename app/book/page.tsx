import Link from "next/link";
import { bookingSteps, bookedSlots } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="card-surface p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Booking flow</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Choose your date, time, and payment method</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            The booking experience is designed for fast checkout with instant confirmation and a clean hourly schedule.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <h2 className="font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="card-surface p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Available schedule</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">One client per slot, selected by hour</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-xl">
                Each booking is limited to one customer per field and time slot so schedules do not overlap.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Field</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookedSlots.map((slot) => (
                    <tr key={`${slot.date}-${slot.time}-${slot.field}`} className="border-t border-white/10 bg-slate-950/50">
                      <td className="px-4 py-3 text-white">{slot.date}</td>
                      <td className="px-4 py-3">{slot.time}</td>
                      <td className="px-4 py-3">{slot.field}</td>
                      <td className="px-4 py-3 text-cyan-300">{slot.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="card-glow p-8">
            <h2 className="text-2xl font-semibold text-white">Checkout preview</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex justify-between"><span>Field</span><span>Elite Turf 1</span></div>
              <div className="flex justify-between"><span>Date</span><span>07 Jul 2026</span></div>
              <div className="flex justify-between"><span>Time</span><span>19:00 - 20:00</span></div>
              <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>Rp 180.000</span></div>
            </div>
            <Link href="/checkout" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
              Continue to checkout
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
