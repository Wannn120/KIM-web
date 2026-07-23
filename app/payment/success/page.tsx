import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";
import { getPaymentTransaction } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

const AUTO_REDIRECT_MS = 5000;

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const transactionId = getSearchParam(resolvedSearchParams.transactionId);
  const payment = transactionId ? await getPaymentTransaction(transactionId).catch(() => null) : null;

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <meta httpEquiv="refresh" content={`${AUTO_REDIRECT_MS / 1000};url=/`} />
        <AnimatedCard className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 text-6xl text-emerald-300">
            ✓
          </div>
          <div className="mb-6 inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            Payment successful
          </div>
          <h1 className="text-4xl font-semibold text-white">Thank you! Your booking is confirmed.</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">
            Your payment has been completed successfully. You will be redirected to the homepage shortly.
          </p>

          <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Payment summary</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-emerald-200">{payment?.status ?? "success"}</span>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2">
              <div className="flex justify-between"><span>Transaction ID</span><span className="text-white">{payment?.transactionId ?? transactionId}</span></div>
              <div className="flex justify-between"><span>Booking ID</span><span className="text-white">{payment?.bookingId ?? "—"}</span></div>
              <div className="flex justify-between"><span>Method</span><span className="text-white">{payment?.paymentMethod ?? "—"}</span></div>
              <div className="flex justify-between"><span>Amount</span><span className="text-white">Rp {payment?.amount?.toLocaleString("id-ID") ?? "0"}</span></div>
              <div className="flex justify-between"><span>Provider</span><span className="text-white">{payment?.provider ?? "—"}</span></div>
              <div className="flex justify-between"><span>Field</span><span className="text-white">{payment?.booking?.field?.name ?? payment?.booking?.fieldId ?? "—"}</span></div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/booking-history"
              className="btn-primary"
            >
              View booking history
            </Link>
            <Link
              href="/"
              className="btn-secondary"
            >
              Back to homepage
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
