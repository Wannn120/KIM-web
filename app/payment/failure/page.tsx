import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

const AUTO_REDIRECT_MS = 5000;

export default function PaymentFailurePage() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <meta httpEquiv="refresh" content={`${AUTO_REDIRECT_MS / 1000};url=/`} />
        <AnimatedCard className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/15 text-6xl text-rose-300">
            ✕
          </div>

          <div className="mb-6 inline-flex rounded-full bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300">
            Payment failed or expired
          </div>

          <h1 className="text-4xl font-semibold text-white">Pembayaran tidak dapat diproses</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">
            Booking Anda belum berhasil dibayar. Anda dapat mencoba kembali atau kembali ke beranda untuk memulai ulang.
          </p>

          <div className="mt-8 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-left">
            <p className="text-sm text-[color:var(--muted)]">
              Beberapa kemungkinan penyebab:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-white">
              <li>pembayaran dibatalkan oleh user</li>
              <li>payment link sudah expired</li>
              <li>transaksi gagal karena verifikasi pihak pembayaran</li>
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
