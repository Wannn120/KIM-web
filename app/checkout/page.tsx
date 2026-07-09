import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="card-surface p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Secure checkout</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review your booking details</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Confirm the field, date, and time before moving to the payment gateway.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Field</p>
              <p className="mt-2 text-xl font-semibold text-white">Elite Turf 1</p>
              <p className="mt-2 text-sm text-slate-400">Indoor • 5v5</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Date</p>
              <p className="mt-2 text-xl font-semibold text-white">07 Jul 2026</p>
              <p className="mt-2 text-sm text-slate-400">19:00 - 20:00</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Total</p>
              <p className="mt-2 text-3xl font-semibold text-white">Rp 170.000</p>
              <p className="mt-2 text-sm text-slate-400">Per hour booking</p>
            </div>
          </div>
        </div>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Payment summary</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between"><span>Base price</span><span>Rp 180.000</span></div>
            <div className="flex justify-between"><span>Service fee</span><span>Rp 10.000</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- Rp 20.000</span></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>Rp 170.000</span></div>
          </div>
          <Link href="/payment" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
            Proceed to payment
          </Link>
        </AnimatedCard>
      </div>
    </main>
  );
}
