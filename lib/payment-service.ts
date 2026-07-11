import { prisma } from "@/lib/prisma";
import { DemoPaymentProvider, PaymentMethod, PaymentStatus, PaymentTransactionInput, PaymentSimulationDetails } from "@/lib/payment-provider";
import { BookingStatus } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";

const paymentProvider = new DemoPaymentProvider();

export async function createPaymentTransaction(input: PaymentTransactionInput) {
  if (!input.bookingId) {
    throw new Error("bookingId is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("A valid amount is required.");
  }

  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const transaction = await paymentProvider.createTransaction(input);

  await prisma.payment.create({
    data: {
      bookingId: input.bookingId,
      transactionId: transaction.transactionId,
      paymentMethod: transaction.paymentMethod,
      amount: input.amount,
      status: transaction.status,
      provider: transaction.providerName,
      expiredAt: new Date(transaction.expiresAt),
    },
  });

  return transaction;
}

export async function getPaymentTransaction(transactionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { booking: true },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  return payment;
}

export async function getPaymentSimulationDetails(method: PaymentMethod): Promise<PaymentSimulationDetails> {
  return paymentProvider.getSimulationDetails(method);
}

export async function processWebhookEvent(transactionId: string, status: PaymentStatus) {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
  if (!booking) {
    throw new Error("Associated booking not found.");
  }

  const now = new Date();
  const updateData: {
    status: PaymentStatus;
    updatedAt: Date;
    paidAt?: Date;
    expiredAt?: Date;
  } = {
    status,
    updatedAt: now,
  };

  if (status === "success") {
    updateData.paidAt = now;
  }

  if (status === "expired") {
    updateData.expiredAt = now;
  }

  await prisma.payment.update({
    where: { transactionId },
    data: updateData,
  });

  let nextBookingStatus: BookingStatus = booking.status as BookingStatus;

  if (status === "success") {
    nextBookingStatus = "confirmed";
  }

  if (status === "expired" || status === "cancelled") {
    nextBookingStatus = "cancelled";
  }

  if (status === "refunded") {
    nextBookingStatus = "refunded";
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: nextBookingStatus },
  });

  if (status === "success") {
    await sendNotification("email-confirmation", {
      bookingId: booking.id,
      amount: payment.amount,
      customerName: booking.customer,
      fieldName: booking.fieldId,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
    });
  }

  if (status === "cancelled" || status === "expired") {
    await sendNotification("booking-cancelled", {
      bookingId: booking.id,
      reason: status === "expired" ? "payment expired" : "payment was cancelled",
    });
  }
}
