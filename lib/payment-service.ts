import { prisma } from "@/lib/prisma";
import { DemoPaymentProvider, PaymentMethod, PaymentStatus, PaymentTransactionInput, PaymentSimulationDetails } from "@/lib/payment-provider";
import { BookingStatus } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";
import { createMidtransTransaction } from "@/lib/midtrans";

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

  // Use Midtrans for payment processing
  const midtransPayload = {
    transaction_details: {
      order_id: input.bookingId,
      gross_amount: input.amount,
    },
    customer_details: {
      first_name: input.customerName || "Guest",
      email: input.email,
      phone: input.phone,
    },
    item_details: [
      {
        id: booking.fieldId,
        name: `Field booking`,
        price: input.amount,
        quantity: 1,
      },
    ],
  };

  const midtransResponse = await createMidtransTransaction(midtransPayload);

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
    transactionId: input.bookingId,
    paymentMethod: input.paymentMethod as PaymentMethod,
    amount: input.amount,
    status: "pending",
    provider: "Midtrans",
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  await prisma.payment.create({ data: createData });

  // Return transaction with Midtrans snap URL
  return {
    transactionId: input.bookingId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: input.paymentMethod as PaymentMethod,
    amount: input.amount,
    status: "pending",
    providerName: "Midtrans",
    snapUrl: midtransResponse.redirect_url,
    snapToken: midtransResponse.token,
  };
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
