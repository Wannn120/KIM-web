import { getPopupBlockedMessage, isPopupWindowOpenable } from "../lib/popup-fallback";

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
});
