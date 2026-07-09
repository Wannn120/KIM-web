import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";

export const dynamic = "force-dynamic";

export default function PaymentSuccessPage() {
  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AnimatedCard className="p-8 text-center">
          <div className="mb-6 inline-flex rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            Payment successful
          </div>
          <h1 className="text-4xl font-semibold text-white">Thank you! Your booking is confirmed.</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">
            We have received your payment and your mini soccer field booking is now secured. You can view it in your booking history.
          </p>
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
