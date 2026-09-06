import crypto from "crypto";
import { getPopupBlockedMessage, isPopupWindowOpenable, shouldPreferDirectNavigation } from "../lib/popup-fallback";
import { buildPaymentLookupWhere, normalizePaymentStatus, resolvePaymentUpdateTransactionId, shouldReclaimBookingStatus } from "../lib/payment-service";
import { expireStalePendingBookings, isBookingSlotBlocked, reclaimExpiredSlotBookings } from "../lib/booking-engine";
import { resolvePaymentSuccessTransactionId } from "../lib/payment-utils";
import { resolveMidtransTransactionStatus, verifyMidtransSignature } from "../lib/midtrans";

describe("popup fallback UX", () => {
  it("returns a clear message when the browser blocks the payment popup", () => {
    const message = getPopupBlockedMessage("https://example.com/pay");

    expect(message).toContain("blocked");
    expect(message).toContain("secure payment link");
    expect(message).toContain("https://example.com/pay");
  });

  it("treats missing or closed popup windows as blocked", () => {
    expect(isPopupWindowOpenable(null)).toBe(false);
    expect(isPopupWindowOpenable(undefined)).toBe(false);
  });

  it("prefers direct navigation on Android and webview browsers", () => {
    expect(shouldPreferDirectNavigation("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36")).toBe(true);
    expect(shouldPreferDirectNavigation("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36")).toBe(true);
    expect(shouldPreferDirectNavigation("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")).toBe(false);
  });

  it("uses the stored transaction ID when Midtrans reports an order_id instead of transaction_id", () => {
    expect(resolvePaymentUpdateTransactionId("ORD-123", { transactionId: "txn-abc", midtransOrderId: "ORD-123" })).toBe("txn-abc");
    expect(resolvePaymentUpdateTransactionId("txn-abc", { transactionId: "txn-abc", midtransOrderId: "ORD-123" })).toBe("txn-abc");
  });

  it("uses the actual payment transaction ID for popup success redirects instead of the booking ID", () => {
    expect(resolvePaymentSuccessTransactionId("550e8400-e29b-41d4-a716-446655440000", {
      transactionId: "TX-midtrans-123",
      midtransOrderId: "TX-midtrans-123",
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    })).toBe("TX-midtrans-123");

    expect(resolvePaymentSuccessTransactionId("550e8400-e29b-41d4-a716-446655440000", {
      transactionId: null,
      midtransOrderId: null,
      bookingId: "550e8400-e29b-41d4-a716-446655440000",
    })).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("only includes bookingId in payment lookup when the identifier is a valid UUID", () => {
    expect(buildPaymentLookupWhere("TX-STATUS-123")).toEqual([
      { transactionId: "TX-STATUS-123" },
      { midtransOrderId: "TX-STATUS-123" },
    ]);

    expect(buildPaymentLookupWhere("550e8400-e29b-41d4-a716-446655440000")).toEqual([
      { transactionId: "550e8400-e29b-41d4-a716-446655440000" },
      { midtransOrderId: "550e8400-e29b-41d4-a716-446655440000" },
      { bookingId: "550e8400-e29b-41d4-a716-446655440000" },
    ]);
  });

  it("treats expired and cancelled bookings as reclaimable for a reopened slot", () => {
    expect(shouldReclaimBookingStatus("expired")).toBe(true);
    expect(shouldReclaimBookingStatus("cancelled")).toBe(true);
    expect(shouldReclaimBookingStatus("refunded")).toBe(true);
    expect(shouldReclaimBookingStatus("confirmed")).toBe(false);
    expect(shouldReclaimBookingStatus("pending")).toBe(false);
  });

  it("marks stale pending bookings as expired so slots become available again after timeout", () => {
    expect(typeof expireStalePendingBookings).toBe("function");
    expect(isBookingSlotBlocked("pending")).toBe(true);
    expect(isBookingSlotBlocked("expired")).toBe(false);
  });

  it("cleans up stale reclaimable bookings before reusing an identical slot", async () => {
    expect(typeof reclaimExpiredSlotBookings).toBe("function");
  });

  it("maps Midtrans status_code values to the correct payment state", () => {
    expect(normalizePaymentStatus("200")).toBe("success");
    expect(normalizePaymentStatus("201")).toBe("pending");
    expect(normalizePaymentStatus("202")).toBe("pending");
    expect(resolveMidtransTransactionStatus({ status_code: "200" })).toBe("settlement");
    expect(normalizePaymentStatus(resolveMidtransTransactionStatus({ status_code: "200" }))).toBe("success");
  });

  it("verifies Midtrans signatures using the standard order_id + status_code + gross_amount + server_key format", () => {
    const serverKey = "Mid-server-test-key";
    const originalServerKey = process.env.MIDTRANS_SERVER_KEY;
    process.env.MIDTRANS_SERVER_KEY = serverKey;

    try {
      const rawBody = JSON.stringify({
        order_id: "ORDER-123",
        status_code: "200",
        gross_amount: "220000",
      });
      const expectedSignature = crypto.createHash("sha512").update(`ORDER-123200220000${serverKey}`).digest("hex");

      expect(verifyMidtransSignature(rawBody, expectedSignature)).toBe(true);
      expect(verifyMidtransSignature(rawBody, "deadbeef")).toBe(false);
    } finally {
      if (originalServerKey === undefined) {
        delete process.env.MIDTRANS_SERVER_KEY;
      } else {
        process.env.MIDTRANS_SERVER_KEY = originalServerKey;
      }
    }
  });
});
