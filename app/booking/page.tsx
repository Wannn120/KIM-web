import { AnimatedCard } from "@/components/animated-card";

const availability = [
  { time: "08:00", available: true },
  { time: "09:00", available: false },
  { time: "10:00", available: true },
  { time: "11:00", available: true },
  { time: "12:00", available: false },
  { time: "13:00", available: true },
];

export const dynamic = "force-dynamic";

export default function BookingPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <AnimatedCard className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Book your slot</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Reserve your next game</h1>
          <p className="mt-4 text-lg text-slate-400">Pick a field, choose your time, and enjoy a seamless experience.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">Selected venue</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Elite Turf 1</h2>
              <p className="mt-2 text-sm text-slate-400">Jakarta Selatan • 5v5 • Indoor</p>
            </div>
                <div className="rounded-3xl border border-[color:rgba(16,185,129,0.12)] bg-[color:rgba(16,185,129,0.06)] p-5">
                  <p className="text-sm text-[color:var(--accent)]">Hourly rate</p>
              <p className="mt-2 text-3xl font-semibold text-white">Rp 180.000</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Availability</h2>
              <span className="text-sm text-slate-400">Today</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {availability.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${slot.available ? "border-[color:rgba(16,185,129,0.12)] bg-[color:rgba(16,185,129,0.06)] text-[color:var(--accent)] hover:bg-[color:rgba(16,185,129,0.08)]" : "cursor-not-allowed border-white/10 bg-slate-950/70 text-slate-500"}`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Booking summary</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between"><span>Field</span><span>Elite Turf 1</span></div>
            <div className="flex justify-between"><span>Date</span><span>07 Jul 2026</span></div>
            <div className="flex justify-between"><span>Time</span><span>10:00 - 11:00</span></div>
            <div className="flex justify-between"><span>Fee</span><span>Rp 180.000</span></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>Rp 180.000</span></div>
          </div>
          <a href="/checkout" className="mt-8 btn-primary">
            Continue to checkout
          </a>
        </AnimatedCard>
      </div>
    </main>
  );
}
