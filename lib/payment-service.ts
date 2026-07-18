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

  // Allow bypassing external gateway in non-production or when explicitly configured
  const skipGateway = process.env.SKIP_PAYMENT_GATEWAY === "true" || process.env.MIDTRANS_IS_PRODUCTION === "false";

  let transaction:
    | {
        transactionId: string;
        expiresAt: string;
        paymentMethod: PaymentMethod;
        amount: number;
        status: PaymentStatus;
        providerName: string;
      }
    | Awaited<ReturnType<typeof paymentProvider.createTransaction>>;

  if (skipGateway) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const id = `OFFLINE-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}-${Math.floor(Math.random() * 90000) + 10000}`;

    transaction = {
      transactionId: id,
      expiresAt,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      status: "pending",
      providerName: "OfflineSimulator",
    };
  } else {
    transaction = await paymentProvider.createTransaction(input);
  }

  const createData: {
    bookingId: string;
    userId: string;
    transactionId: string;
    paymentMethod: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    provider: string;
    expiredAt: Date;
    paidAt?: Date;
  } = {
    bookingId: input.bookingId,
    userId: booking.userId,
    transactionId: transaction.transactionId,
    paymentMethod: transaction.paymentMethod,
    amount: input.amount,
    status: transaction.status,
    provider: transaction.providerName,
    expiredAt: new Date(transaction.expiresAt),
  };

  if (transaction.status === "success") {
    createData.paidAt = new Date();
  }

  await prisma.payment.create({ data: createData });

  // If transaction is already successful, update booking status immediately
  if (transaction.status === "success") {
    await prisma.booking.update({ where: { id: input.bookingId }, data: { status: "confirmed" } });
    await sendNotification("email-confirmation", {
      bookingId: booking.id,
      amount: createData.amount,
      customerName: booking.customerName,
      fieldName: booking.fieldId,
      startAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.startTime}`,
      endAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.endTime}`,
      email: booking.customerEmail ?? undefined,
      phone: booking.customerPhone,
    });
  }

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
      customerName: booking.customerName,
      fieldName: booking.fieldId,
      startAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.startTime}`,
      endAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.endTime}`,
      email: booking.customerEmail ?? undefined,
      phone: booking.customerPhone,
    });
  }

  if (status === "cancelled" || status === "expired") {
    await sendNotification("booking-cancelled", {
      bookingId: booking.id,
      reason: status === "expired" ? "payment expired" : "payment was cancelled",
    });
  }
}
