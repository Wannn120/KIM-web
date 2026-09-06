export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizePhone(phone?: string) {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  if (!trimmed) return undefined;
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  return digitsOnly || undefined;
}

function normalizeEmail(email?: string) {
  if (!email) return undefined;
  const trimmed = email.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function buildMidtransCustomerDetails(customerName?: string, email?: string, phone?: string) {
  const firstName = customerName?.trim() || "Guest";
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  return {
    first_name: firstName,
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
    ...(normalizedPhone ? { phone: normalizedPhone } : {}),
  };
}

export function resolvePaymentSuccessTransactionId(
  bookingId: string,
  payment?: { transactionId?: string | null; midtransOrderId?: string | null; bookingId?: string | null } | null,
): string {
  const cleanedBookingId = bookingId?.trim() ?? "";
  const transactionId = payment?.transactionId?.trim();
  const midtransOrderId = payment?.midtransOrderId?.trim();
  const paymentBookingId = payment?.bookingId?.trim();

  if (transactionId) {
    return transactionId;
  }

  if (midtransOrderId) {
    return midtransOrderId;
  }

  if (paymentBookingId && isUuid(paymentBookingId)) {
    return paymentBookingId;
  }

  return cleanedBookingId;
}

export function buildPaymentSuccessRedirectUrl(
  result: {
    transaction_id?: string | null;
    transactionId?: string | null;
    order_id?: string | null;
    orderId?: string | null;
    status_code?: string | number | null;
    transaction_status?: string | null;
    transactionStatus?: string | null;
  } | null | undefined,
  fallbackTransactionId: string,
) {
  const transactionId = result?.transaction_id?.toString().trim() || result?.transactionId?.toString().trim() || fallbackTransactionId;
  const orderId = result?.order_id?.toString().trim() || result?.orderId?.toString().trim() || transactionId;
  const statusCode = result?.status_code?.toString().trim() || "";
  const transactionStatus = result?.transaction_status?.toString().trim() || result?.transactionStatus?.toString().trim() || "";

  const params = new URLSearchParams();
  params.set("transactionId", transactionId);
  if (orderId) params.set("order_id", orderId);
  if (statusCode) params.set("status_code", statusCode);
  if (transactionStatus) params.set("transaction_status", transactionStatus);
  if (transactionId && transactionId !== orderId) params.set("transaction_id", transactionId);
  return `/payment/success?${params.toString()}`;
}
