import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";
import { getPaymentTransaction, reconcilePaymentStatus } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

const AUTO_REDIRECT_MS = 8000;

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
  const transactionId = getSearchParam(resolvedSearchParams.transactionId) || getSearchParam(resolvedSearchParams.order_id) || getSearchParam(resolvedSearchParams.transaction_id);
  const transactionStatus = getSearchParam(resolvedSearchParams.transaction_status) || getSearchParam(resolvedSearchParams.status) || getSearchParam(resolvedSearchParams.transactionStatus);

  if (transactionId) {
    await reconcilePaymentStatus(transactionId, transactionStatus).catch(() => undefined);
  }

  const payment = transactionId ? await getPaymentTransaction(transactionId).catch(() => null) : null;
  const status = payment?.status ?? "pending";
  const isSuccess = status === "success";
  const isFailed = status === "failed" || status === "cancelled" || status === "expired";
  const isPending = status === "pending";
  const showAutoRedirect = isSuccess || isFailed;
  const refreshUrl = `/payment/success?transactionId=${encodeURIComponent(transactionId)}`;

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {showAutoRedirect ? <meta httpEquiv="refresh" content={`${AUTO_REDIRECT_MS / 1000};url=/`} /> : null}
        <AnimatedCard className="p-8 text-center">
          <div
            className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full text-7xl ${
              isSuccess ? "bg-emerald-500/15 text-emerald-300" : isFailed ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {isSuccess ? "✓" : isFailed ? "✕" : "…"}
          </div>

          <div className={`mb-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
            isSuccess ? "bg-emerald-500/10 text-emerald-300" : isFailed ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"
          }`}>
            {isSuccess ? "Payment successful" : isFailed ? "Payment failed" : "Payment pending"}
          </div>

          <h1 className="text-4xl font-semibold text-white">
            {isSuccess ? "Thank you! Your booking is confirmed." : isFailed ? "Your payment did not complete." : "Your payment is still pending."}
          </h1>

          <p className="mt-4 text-lg text-[color:var(--muted)]">
            {isSuccess
              ? "Your payment has been completed successfully. You will be redirected to the homepage shortly."
              : isFailed
              ? "Your payment could not be completed. Please try again or return to the homepage."
              : "We are waiting for payment confirmation from the payment provider. Please stay on this page or refresh the status manually."}
          </p>

          {isPending ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-[color:var(--muted)]">
                The payment is pending. It can take a few moments for Midtrans to confirm the status. If the status does not update automatically, refresh below.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href={refreshUrl} className="btn-secondary w-full sm:w-auto">
                  Refresh status
                </Link>
                <Link href="/booking-history" className="btn-primary w-full sm:w-auto">
                  View booking history
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Payment summary</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-[color:var(--muted)]">{status}</span>
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
            <Link href="/booking-history" className="btn-primary">
              View booking history
            </Link>
            <Link href="/" className="btn-secondary">
              Back to homepage
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
