import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

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

  if (payment?.snapUrl) {
    redirect(payment.snapUrl);
  }

  if (payment) {
    redirect("/");
  }

  redirect("/");
}
