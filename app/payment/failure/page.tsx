import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";
import { getPaymentTransaction, reconcilePaymentStatus } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function PaymentFailurePage({
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
  const status = payment?.status ?? "failed";
  const isPending = status === "pending";
  const isFailed = status === "failed" || status === "cancelled" || status === "expired";
  const refreshUrl = `/payment/failure?transactionId=${encodeURIComponent(transactionId)}`;
  const invoiceNumber = payment?.invoice?.invoiceNumber;
  const invoiceAmount = payment?.amount ? `Rp ${payment.amount.toLocaleString("id-ID")}` : undefined;
  const paymentMethod = payment?.paymentMethod;

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AnimatedCard className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-rose-500/15 text-7xl text-rose-300">
            ✕
          </div>

          <div className="mb-6 inline-flex rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300">
            {isPending ? "Payment pending" : "Payment failed or expired"}
          </div>

          <h1 className="text-4xl font-semibold text-white">
            {isPending
              ? "Pembayaran sedang menunggu konfirmasi"
              : "Pembayaran tidak dapat diproses"}
          </h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">
            {isPending
              ? "Pembayaran Anda masih dalam proses. Gunakan tombol refresh untuk memeriksa status terbaru."
              : "Mohon maaf, pembayaran Anda tidak berhasil. Silakan kembali ke beranda atau cek riwayat booking untuk melanjutkan pembayaran."}
          </p>

          {isPending ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-left">
              <p className="text-sm text-[color:var(--muted)]">
                Jika status tidak berubah setelah beberapa saat, refresh halaman atau periksa riwayat booking untuk melanjutkan.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link href={refreshUrl} className="btn-secondary">
                  Refresh status
                </Link>
                <Link href="/booking-history" className="btn-primary">
                  Lihat riwayat booking
                </Link>
              </div>
            </div>
          ) : null}

          <div className={`mt-8 rounded-3xl p-6 text-left ${isPending ? "border border-white/10 bg-[color:var(--surface)]" : "border border-rose-500/20 bg-rose-500/10"}`}>
            {invoiceNumber ? (
              <div className="mb-4 rounded-2xl bg-white/5 p-4 text-left">
                <p className="text-sm text-[color:var(--muted)]">Nomor invoice</p>
                <p className="mt-1 text-lg font-semibold text-white">{invoiceNumber}</p>
              </div>
            ) : null}
            {invoiceAmount || paymentMethod ? (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {invoiceAmount ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-left">
                    <p className="text-sm text-[color:var(--muted)]">Jumlah pembayaran</p>
                    <p className="mt-1 text-lg font-semibold text-white">{invoiceAmount}</p>
                  </div>
                ) : null}
                {paymentMethod ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-left">
                    <p className="text-sm text-[color:var(--muted)]">Metode pembayaran</p>
                    <p className="mt-1 text-lg font-semibold text-white">{paymentMethod}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
            <p className="text-sm text-[color:var(--muted)]">Beberapa kemungkinan penyebab:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-white">
              <li>Payment link sudah kadaluarsa</li>
              <li>Transaksi dibatalkan oleh pengguna</li>
              <li>Transaksi gagal karena verifikasi penyedia pembayaran</li>
            </ul>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/booking-history" className="btn-primary">
              Lihat riwayat booking
            </Link>
            <Link href="/" className="btn-secondary">
              Kembali ke beranda
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
