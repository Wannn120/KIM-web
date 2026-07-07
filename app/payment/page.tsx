import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

export default function PaymentPage() {
  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%)] px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AnimatedCard className="p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">Payment gateway</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Finish your reservation</h1>
              <p className="mt-4 text-lg text-slate-400">Choose a payment method and confirm your booking instantly.</p>
              <div className="mt-8 grid gap-3">
                {['Midtrans', 'Bank Transfer', 'e-Wallet'].map((method) => (
                  <button key={method} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10">
                    <span>{method}</span>
                    <span className="text-cyan-300">Select →</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-500/10 p-8">
              <h2 className="text-2xl font-semibold text-white">Booking confirmation</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex justify-between"><span>Order</span><span>#BK-1024</span></div>
                <div className="flex justify-between"><span>Amount</span><span>Rp 170.000</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-cyan-300">Pending payment</span></div>
              </div>
              <button className="mt-8 w-full rounded-full bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400">
                Pay now
              </button>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
