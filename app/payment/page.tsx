import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";

const paymentMethods = ["Midtrans", "Bank Transfer", "e-Wallet"];

export const dynamic = "force-dynamic";

export default function PaymentPage() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AnimatedCard className="p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Payment gateway</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Finish your reservation</h1>
              <p className="mt-4 text-lg text-slate-400">Choose a secure payment option and complete your booking.</p>
              <div className="mt-8 grid gap-3">
                {paymentMethods.map((method) => (
                  <button key={method} className="flex items-center justify-between rounded-3xl border border-white/10 card-surface px-4 py-4 text-left text-sm text-slate-300 transition hover:border-[color:rgba(16,185,129,0.12)] hover:bg-[color:rgba(16,185,129,0.06)]">
                    <div>
                      <p className="font-semibold text-white">{method}</p>
                      <p className="mt-1 text-slate-400">Secure and fast checkout using {method}.</p>
                    </div>
                    <span className="text-[color:var(--accent)]">Select</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 card-surface p-8">
              <h2 className="text-2xl font-semibold text-white">Order summary</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-300">
                <div className="flex justify-between"><span>Order</span><span>#BK-1024</span></div>
                <div className="flex justify-between"><span>Amount</span><span>Rp 170.000</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-[color:var(--accent)]">Pending payment</span></div>
              </div>
              <Link href="/payment/success" className="mt-8 btn-primary">
                Pay now
              </Link>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
