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

  return `Your browser blocked the payment popup. Please allow pop-ups for this site and try again, or use the secure payment link below.${paymentLinkText}`;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}
