import { prisma } from "@/lib/prisma";
import { DemoPaymentProvider, PaymentMethod, PaymentStatus, PaymentTransactionInput, PaymentSimulationDetails } from "@/lib/payment-provider";
import { BookingStatus } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";
import { createMidtransTransaction } from "@/lib/midtrans";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";
import { buildMidtransCustomerDetails, isUuid } from "@/lib/payment-utils";

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

async function findPaymentByIdentifier(identifier: string) {
  if (!identifier || !identifier.trim()) {
    return null;
  }

  return prisma.payment.findFirst({
    where: {
      OR: [
        { transactionId: identifier },
        { midtransOrderId: identifier },
        { bookingId: identifier },
      ],
    },
    include: { booking: true },
  });
}

function buildInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createPaymentTransaction(input: PaymentTransactionInput & { appBaseUrl?: string; forceNew?: boolean }) {
  if (!input.bookingId) {
    throw new Error("bookingId is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("A valid amount is required.");
  }

  const bookingId = input.bookingId.trim();
  const normalizedBookingId = isUuid(bookingId) ? bookingId : undefined;

  if (!normalizedBookingId) {
    throw new Error("Invalid bookingId format.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: normalizedBookingId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.totalPrice > 0 && input.amount !== booking.totalPrice) {
    throw new Error(`Amount mismatch: expected booking total ${booking.totalPrice}, received ${input.amount}.`);
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      bookingId: normalizedBookingId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment && !input.forceNew && existingPayment.status === "pending" && existingPayment.expiredAt && existingPayment.expiredAt > new Date() && existingPayment.snapToken && existingPayment.snapUrl) {
    return {
      transactionId: existingPayment.transactionId,
      expiresAt: existingPayment.expiredAt?.toISOString() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      paymentMethod: existingPayment.paymentMethod as PaymentMethod,
      amount: existingPayment.amount,
      status: existingPayment.status,
      providerName: existingPayment.provider,
      snapUrl: existingPayment.snapUrl,
      snapToken: existingPayment.snapToken,
    };
  }

  const appBaseUrl = input.appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || "https://klaten-international-minisoccer.vercel.app";
  const uniqueTransactionId = `${normalizedBookingId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const midtransOrderId = uniqueTransactionId;
  const customerDetails = buildMidtransCustomerDetails(input.customerName, input.email, input.phone);
  const midtransPayload = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: input.amount,
    },
    customer_details: customerDetails,
    item_details: [
      {
        id: normalizedBookingId,
        name: DEFAULT_FIELD_NAME,
        price: input.amount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${appBaseUrl}/payment/success?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
      error: `${appBaseUrl}/payment/failure?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
      pending: `${appBaseUrl}/payment/success?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
    },
    notification_url: `${appBaseUrl}/api/payments/webhook`,
    expiry: {
      unit: "minutes",
      duration: 15,
    },
  };

  const midtransResponse = await createMidtransTransaction(midtransPayload);

  const paymentRecord = existingPayment
    ? await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionId: uniqueTransactionId,
          midtransOrderId,
          snapToken: midtransResponse.token,
          snapUrl: midtransResponse.redirect_url,
          paymentMethod: input.paymentMethod as PaymentMethod,
          amount: input.amount,
          status: "pending",
          provider: "Midtrans",
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
          updatedAt: new Date(),
        },
      })
    : await prisma.payment.create({
        data: {
          bookingId: normalizedBookingId,
          transactionId: uniqueTransactionId,
          midtransOrderId,
          snapToken: midtransResponse.token,
          snapUrl: midtransResponse.redirect_url,
          paymentMethod: input.paymentMethod as PaymentMethod,
          amount: input.amount,
          status: "pending",
          provider: "Midtrans",
          expiredAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

  await prisma.invoice.upsert({
    where: { bookingId: booking.id },
    update: {
      paymentId: paymentRecord.id,
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
    transactionId: uniqueTransactionId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: input.paymentMethod as PaymentMethod,
    amount: input.amount,
    status: "pending",
    providerName: "Midtrans",
    snapUrl: midtransResponse.redirect_url,
    snapToken: midtransResponse.token,
  };
}

export async function reconcilePaymentStatus(transactionId: string, status?: string) {
  const normalized = normalizePaymentStatus(status ?? "");

  if (!transactionId || !normalized || normalized === "pending") {
    return null;
  }

  await processWebhookEvent(transactionId, normalized);
  return normalized;
}

export async function expirePendingPayments() {
  const now = new Date();
  const overduePayments = await prisma.payment.findMany({
    where: {
      status: "pending",
      expiredAt: { lt: now },
    },
    select: {
      id: true,
      bookingId: true,
    },
  });

  if (overduePayments.length === 0) {
    return;
  }

  const bookingIds = overduePayments.map((payment) => payment.bookingId);
  const paymentIds = overduePayments.map((payment) => payment.id);

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status: "expired", updatedAt: now, expiredAt: now },
    }),
    prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "expired", updatedAt: now },
    }),
    prisma.invoice.updateMany({
      where: { bookingId: { in: bookingIds } },
      data: { status: "issued", updatedAt: now },
    }),
  ]);

}

export async function getPaymentTransaction(transactionId: string) {
  await expirePendingPayments();

  const payment = await findPaymentByIdentifier(transactionId);

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const result = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: {
      booking: true,
      invoice: true,
    },
  });

  if (!result) {
    throw new Error("Payment record not found.");
  }

  return result;
}

export async function getPaymentTransactionByBookingId(bookingId: string) {
  await expirePendingPayments();

  const payment = await prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    include: {
      booking: true,
      invoice: true,
    },
  });

  return payment;
}

export async function getPaymentSimulationDetails(method: PaymentMethod): Promise<PaymentSimulationDetails> {
  return paymentProvider.getSimulationDetails(method);
}

export async function processWebhookEvent(transactionId: string, status: PaymentStatus) {
  const normalized = normalizePaymentStatus(status);

  const payment = await findPaymentByIdentifier(transactionId);

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

  let nextBookingStatus: BookingStatus = "cancelled";
  if (normalized === "success") {
    nextBookingStatus = "confirmed";
  } else if (normalized === "refunded") {
    nextBookingStatus = "refunded";
  } else if (normalized === "expired") {
    nextBookingStatus = "expired";
  }

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
    const invoice = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });

    await sendNotification("email-confirmation", {
      bookingId: booking.id,
      invoiceNumber: invoice?.invoiceNumber,
      amount: payment.amount,
      customerName: booking.customerName,
      fieldName: DEFAULT_FIELD_NAME,
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
