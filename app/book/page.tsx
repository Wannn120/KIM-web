import { bookingSteps } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default function BookPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-950/20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Booking flow</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Choose your date, time, and payment method</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            The booking experience is designed for fast checkout with instant confirmation and WhatsApp updates.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {bookingSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <h2 className="font-semibold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-3xl border border-cyan-400/25 bg-cyan-500/10 p-8">
          <h2 className="text-2xl font-semibold text-white">Checkout preview</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Field</span>
              <span>Elite Turf 1</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>07 Jul 2026</span>
            </div>
            <div className="flex justify-between">
              <span>Time</span>
              <span>19:00 - 20:00</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white">
              <span>Total</span>
              <span>Rp 180.000</span>
            </div>
          </div>
          <button className="mt-8 w-full rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
            Continue to payment
          </button>
        </aside>
      </div>
    </main>
  );
}
