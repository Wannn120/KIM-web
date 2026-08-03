import {
  isBookingPaymentPath,
  validatePaymentRouteCsp,
  MIDTRANS_APP_DOMAIN,
  MIDTRANS_API_DOMAIN,
  MIDTRANS_SNAP_ASSETS_DOMAIN,
} from "@/lib/security-headers";

describe("security headers helpers", () => {
  describe("isBookingPaymentPath", () => {
    it("returns true for valid booking payment paths", () => {
      expect(isBookingPaymentPath("/booking/abc123/payment")).toBe(true);
      expect(isBookingPaymentPath("/booking/ABC-1/payment/")).toBe(true);
    });

    it("returns false for non-payment booking paths", () => {
      expect(isBookingPaymentPath("/booking/abc123")).toBe(false);
      expect(isBookingPaymentPath("/booking/abc123/payment/extra")).toBe(false);
      expect(isBookingPaymentPath("/checkout")).toBe(false);
    });
  });

  describe("validatePaymentRouteCsp", () => {
    const originalConsoleWarn = console.warn;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it("does not warn when payment route CSP includes the exact Midtrans sources and script-src-elem", () => {
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${MIDTRANS_APP_DOMAIN} ${MIDTRANS_SNAP_ASSETS_DOMAIN} ${MIDTRANS_API_DOMAIN} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com`,
        `script-src-elem 'self' ${MIDTRANS_APP_DOMAIN} ${MIDTRANS_SNAP_ASSETS_DOMAIN} https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "style-src-elem 'self' https://fonts.googleapis.com",
        `img-src 'self' data: ${MIDTRANS_SNAP_ASSETS_DOMAIN} ${MIDTRANS_APP_DOMAIN} https://pay.google.com https://g.alicdn.com https://res.cloudinary.com`,
        `connect-src 'self' ${MIDTRANS_APP_DOMAIN} ${MIDTRANS_API_DOMAIN} ${MIDTRANS_SNAP_ASSETS_DOMAIN}`,
        `frame-src ${MIDTRANS_APP_DOMAIN} ${MIDTRANS_SNAP_ASSETS_DOMAIN}`,
        `child-src ${MIDTRANS_APP_DOMAIN} ${MIDTRANS_SNAP_ASSETS_DOMAIN}`,
      ].join("; ");

      validatePaymentRouteCsp(csp, "/booking/abc123/payment");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("warns when payment route CSP is missing required Midtrans sources", () => {
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${MIDTRANS_APP_DOMAIN}`,
        `script-src-elem 'self' ${MIDTRANS_APP_DOMAIN}`,
      ].join("; ");

      validatePaymentRouteCsp(csp, "/booking/abc123/payment");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Booking payment route CSP is missing required Midtrans sources"));
    });

    it("warns when payment route CSP is missing script-src-elem", () => {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://snap-assets.sandbox.midtrans.com https://api.sandbox.midtrans.com",
      ].join("; ");

      validatePaymentRouteCsp(csp, "/booking/abc123/payment");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("missing script-src-elem"));
    });

    it("does not warn for non-payment routes", () => {
      const csp = "default-src 'self'";
      validatePaymentRouteCsp(csp, "/checkout");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
