import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <main className="flex-1 bg-slate-950 px-6 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <AnimatedCard className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Secure checkout</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Review your booking details</h1>
          <div className="mt-8 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between"><span>Elite Turf 1</span><span className="text-cyan-300">Indoor • 5v5</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between"><span>07 Jul 2026</span><span>10:00 - 11:00</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between"><span>Player count</span><span>10 players</span></div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-8">
          <h2 className="text-2xl font-semibold text-white">Payment summary</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between"><span>Base price</span><span>Rp 180.000</span></div>
            <div className="flex justify-between"><span>Service fee</span><span>Rp 10.000</span></div>
            <div className="flex justify-between"><span>Discount</span><span>- Rp 20.000</span></div>
            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>Rp 170.000</span></div>
          </div>
          <a href="/payment" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
            Proceed to payment
          </a>
        </AnimatedCard>
      </div>
    </main>
  );
}
