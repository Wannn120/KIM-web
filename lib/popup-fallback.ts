export function isPopupWindowOpenable(popup: Window | null | undefined): popup is Window {
  if (!popup) return false;

  try {
    return !popup.closed && typeof popup.focus === "function";
  } catch {
    return false;
  }
}

export function getPopupBlockedMessage(fallbackUrl?: string | null): string {
  const paymentLinkText = fallbackUrl ? ` Use this secure payment link: ${fallbackUrl}` : "";

  return `Your browser blocked the payment popup. Please allow pop-ups for this site, or use the secure payment link below. On Android and some desktop browsers, direct payment-page navigation is often required.${paymentLinkText}`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

export function shouldPreferDirectNavigation(userAgent?: string): boolean {
  const agent = userAgent ?? (typeof navigator === "undefined" ? "" : navigator.userAgent);
  if (!agent) {
    return false;
  }

  const normalized = agent.toLowerCase();
  if (/android/i.test(normalized) && /wv|webview|chrome.*mobile|samsungbrowser/i.test(normalized)) {
    return true;
  }

  return isMobileDevice() || /android/i.test(normalized);
}
