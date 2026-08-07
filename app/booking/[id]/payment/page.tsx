import { notFound } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";
import { BookingPaymentEmbed } from "@/components/booking-payment-embed";
import { prisma } from "@/lib/prisma";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";
import { formatCurrency } from "@/utils/formatting";

export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function formatBookingDate(bookingDate: Date) {
  return bookingDate.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function BookingPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    notFound();
  }

  const payment = await prisma.payment.findFirst({
    where: { bookingId: booking.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Payment checkout</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Complete your booking payment</h1>
              <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
                Pay securely with Midtrans Snap Popup. Your booking will be confirmed once payment is completed.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-[color:var(--muted)]">
              Booking ID
              <p className="mt-2 text-lg font-semibold text-white">{booking.id}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Field</p>
              <p className="mt-3 text-xl font-semibold text-white">{DEFAULT_FIELD_NAME}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Date</p>
              <p className="mt-3 text-xl font-semibold text-white">{formatBookingDate(booking.bookingDate)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Time</p>
              <p className="mt-3 text-xl font-semibold text-white">{booking.startTime} - {booking.endTime}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[color:var(--surface)] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">Total</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(booking.totalPrice)}</p>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Secure payment</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Pay with Midtrans Snap</h2>
            </div>
              <p className="max-w-xl text-sm text-[color:var(--muted)]">
                The page will open the Midtrans Snap popup. If the popup cannot open, use the fallback payment link.
              </p>
          </div>

          <div className="mt-8">
            <BookingPaymentEmbed
              bookingId={booking.id}
              amount={booking.totalPrice}
              fieldName={DEFAULT_FIELD_NAME}
              customerName={booking.customerName ?? undefined}
              customerEmail={booking.customerEmail ?? undefined}
              customerPhone={booking.customerPhone ?? undefined}
              initialPayment={payment ? {
                status: payment.status,
                snapToken: payment.snapToken,
                snapUrl: payment.snapUrl,
              } : null}
            />
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}
