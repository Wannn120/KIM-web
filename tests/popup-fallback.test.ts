import crypto from "crypto";
import { getPopupBlockedMessage, isPopupWindowOpenable, shouldPreferDirectNavigation } from "../lib/popup-fallback";
import { resolvePaymentUpdateTransactionId, shouldReclaimBookingStatus } from "../lib/payment-service";
import { verifyMidtransSignature } from "../lib/midtrans";

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

  it("treats expired and cancelled bookings as reclaimable for a reopened slot", () => {
    expect(shouldReclaimBookingStatus("expired")).toBe(true);
    expect(shouldReclaimBookingStatus("cancelled")).toBe(true);
    expect(shouldReclaimBookingStatus("refunded")).toBe(true);
    expect(shouldReclaimBookingStatus("confirmed")).toBe(false);
    expect(shouldReclaimBookingStatus("pending")).toBe(false);
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
