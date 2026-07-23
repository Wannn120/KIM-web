import { prisma } from "@/lib/prisma";
import { DemoPaymentProvider, PaymentMethod, PaymentStatus, PaymentTransactionInput, PaymentSimulationDetails } from "@/lib/payment-provider";
import { BookingStatus } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";
import { createMidtransTransaction } from "@/lib/midtrans";

const paymentProvider = new DemoPaymentProvider();

function normalizePaymentStatus(status: string): PaymentStatus {
  const lower = status.toLowerCase();

  if (["capture", "settlement", "success"].includes(lower)) return "success";
  if (["deny", "failure", "failed"].includes(lower)) return "failed";
  if (["expire", "expired"].includes(lower)) return "expired";
  if (["cancel", "cancelled"].includes(lower)) return "cancelled";
  if (["refund", "refunded"].includes(lower)) return "refunded";
  return "pending";
}

function buildInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createPaymentTransaction(input: PaymentTransactionInput) {
  if (!input.bookingId) {
    throw new Error("bookingId is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("A valid amount is required.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { field: true },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

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
        name: booking.field?.name ?? "Field booking",
        price: input.amount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://klaten-international-minisoccer.vercel.app"}/payment/success?transactionId=${encodeURIComponent(input.bookingId)}`,
    },
  };

  const midtransResponse = await createMidtransTransaction(midtransPayload);
  const paymentRecord = await prisma.payment.create({
    data: {
      bookingId: input.bookingId,
      transactionId: input.bookingId,
      midtransOrderId: input.bookingId,
      snapToken: midtransResponse.token,
      paymentLinkUrl: midtransResponse.redirect_url,
      paymentMethod: input.paymentMethod as PaymentMethod,
      amount: input.amount,
      status: "pending",
      provider: "Midtrans",
      expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.invoice.upsert({
    where: { bookingId: booking.id },
    update: {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      status: "issued",
      updatedAt: new Date(),
    },
    create: {
      invoiceNumber: buildInvoiceNumber(),
      bookingId: booking.id,
      paymentId: paymentRecord.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      status: "issued",
    },
  });

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
    include: { booking: { include: { field: true } } },
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
  const normalized = normalizePaymentStatus(status);

  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { booking: { include: { field: true } } },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const booking = payment.booking;
  const now = new Date();

  const updateData: {
    status: PaymentStatus;
    updatedAt: Date;
    paidAt?: Date;
    expiredAt?: Date;
  } = {
    status: normalized,
    updatedAt: now,
  };

  if (normalized === "success") {
    updateData.paidAt = now;
  }

  if (["expired", "failed", "cancelled"].includes(normalized)) {
    updateData.expiredAt = now;
  }

  await prisma.payment.update({
    where: { transactionId },
    data: updateData,
  });

  const nextBookingStatus: BookingStatus = normalized === "success"
    ? "confirmed"
    : normalized === "refunded"
    ? "refunded"
    : "cancelled";

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: nextBookingStatus },
  });

  await prisma.invoice.upsert({
    where: { bookingId: booking.id },
    update: {
      status: normalized === "success" ? "paid" : "issued",
      paidAt: normalized === "success" ? now : undefined,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      updatedAt: now,
    },
    create: {
      invoiceNumber: buildInvoiceNumber(),
      bookingId: booking.id,
      paymentId: payment.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      status: normalized === "success" ? "paid" : "issued",
    },
  });

  if (normalized === "success") {
    await sendNotification("email-confirmation", {
      bookingId: booking.id,
      amount: payment.amount,
      customerName: booking.customerName,
      fieldName: booking.field?.name ?? booking.fieldId,
      startAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.startTime}`,
      endAt: `${booking.bookingDate.toISOString().slice(0, 10)} ${booking.endTime}`,
      email: booking.customerEmail ?? undefined,
      phone: booking.customerPhone,
    });
  }

  if (["cancelled", "expired", "failed"].includes(normalized)) {
    await sendNotification("booking-cancelled", {
      bookingId: booking.id,
      reason: normalized === "expired" ? "payment expired" : normalized === "failed" ? "payment failed" : "payment was cancelled",
    });
  }
}
