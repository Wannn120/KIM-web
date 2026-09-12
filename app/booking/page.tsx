import { AnimatedCard } from "@/components/animated-card";
import TimeSlotSelector, { Slot } from "@/components/time-slot-selector";
import { DEFAULT_FIELD } from "@/lib/venue";
import { getFieldHourlyRate } from "@/lib/site-content";

  const availability: Slot[] = [
    { time: "07:00", available: true },
    { time: "08:00", available: true },
    { time: "09:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: true },
    { time: "12:00", available: true },
    { time: "13:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
  ];

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const hourlyRate = await getFieldHourlyRate();

  return (
    <main className="flex-1 bg-[color:var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AnimatedCard className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Book your slot</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Reserve your next game</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">Choose your time and enjoy a seamless experience.</p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 card-surface p-5">
              <p className="text-sm text-[color:var(--muted)]">Selected venue</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{DEFAULT_FIELD.name}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{DEFAULT_FIELD.location} • {DEFAULT_FIELD.type}</p>
            </div>
                <div className="rounded-3xl border border-[color:rgba(16,185,129,0.12)] bg-[color:rgba(16,185,129,0.06)] p-5">
                  <p className="text-sm text-[color:var(--accent)]">Hourly rate</p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">Rp {hourlyRate.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Availability</h2>
              <span className="text-sm text-[color:var(--muted)]">Today</span>
            </div>
            <div>
              <TimeSlotSelector
                availability={availability}
                onChange={(selected) => {
                  // TODO: wire selected times into booking summary / checkout
                  console.log("selected slots", selected);
                }}
              />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">Booking summary</h2>
          <div className="mt-6 space-y-4 text-sm text-[color:var(--muted)]">
            <div className="flex justify-between"><span>Field</span><span>{DEFAULT_FIELD.name}</span></div>
            <div className="flex justify-between"><span>Date</span><span>07 Jul 2026</span></div>
            <div className="flex justify-between"><span>Time</span><span>10:00 - 11:00</span></div>
            <div className="flex justify-between"><span>Fee</span><span>Rp 180.000</span></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-[color:var(--foreground)]"><span>Total</span><span>Rp 180.000</span></div>
          </div>
          <a href="/checkout" className="mt-8 btn-primary">
            Continue to checkout
          </a>
        </AnimatedCard>
      </div>
    </main>
  );
}
