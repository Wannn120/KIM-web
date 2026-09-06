export const FALLBACK_REMOTE_IMAGES = [
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1556056504-4c2c6f4388a5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
];

export function normalizeRemoteImageUrl(url?: string | null) {
  if (typeof url !== "string") return "";
  return url.trim().replace(/[\r\n\t]+/g, "");
}

const KNOWN_STALE_CLOUDINARY_URLS = new Set([
  "https://res.cloudinary.com/ljbxjpox/image/upload/v1785465835/utama_cifncb.jpg",
  "https://res.cloudinary.com/ljbxjpox/image/upload/v1785465834/lapangan_premium_aqejyy.jpg",
  "https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/lampu_malam_xntenr.jpg",
  "https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/fasilitas_sewa_o0uptk.jpg",
  "https://res.cloudinary.com/ljbxjpox/image/upload/v1785465837/citarasa_komunitas_ey2pmm.jpg",
]);

export function isValidRemoteImageUrl(url?: string | null) {
  const normalized = normalizeRemoteImageUrl(url);
  if (!normalized) return false;

  if (KNOWN_STALE_CLOUDINARY_URLS.has(normalized)) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && !KNOWN_STALE_CLOUDINARY_URLS.has(normalized);
  } catch {
    return false;
  }
}

export function getSafeRemoteImageUrl(candidate?: string, fallbackUrls: string[] = FALLBACK_REMOTE_IMAGES, fallbackIndex = 0) {
  const normalized = normalizeRemoteImageUrl(candidate);
  if (isValidRemoteImageUrl(normalized)) return normalized;

  const safeFallbacks = fallbackUrls.filter((url) => isValidRemoteImageUrl(url));
  if (safeFallbacks.length === 0) return "";

  const index = Math.abs(fallbackIndex) % safeFallbacks.length;
  return safeFallbacks[index] ?? safeFallbacks[0];
}
