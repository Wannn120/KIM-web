import { getSafeRemoteImageUrl, normalizeRemoteImageUrl } from "@/lib/remote-image";

describe("image fallback helpers", () => {
  it("normalizes whitespace and newlines from remote image URLs", () => {
    expect(normalizeRemoteImageUrl(" https://example.com/a.jpg\n\r\t ")).toBe("https://example.com/a.jpg");
  });

  it("returns a valid fallback image when the database value is missing or invalid", () => {
    const fallback = [
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    ];
    expect(getSafeRemoteImageUrl("", fallback)).toBe(fallback[0]);
    expect(getSafeRemoteImageUrl("not-a-url", fallback)).toBe(fallback[0]);
    expect(getSafeRemoteImageUrl("not-a-url", fallback, 1)).toBe(fallback[1]);
  });

  it("keeps a valid Cloudinary database URL instead of replacing it with a fallback", () => {
    const cloudinaryUrl = "https://res.cloudinary.com/demo/image/upload/v1234567890/hero.jpg";
    expect(getSafeRemoteImageUrl(cloudinaryUrl)).toBe(cloudinaryUrl);
    expect(getSafeRemoteImageUrl(`  ${cloudinaryUrl}\n\r\t`)).toBe(cloudinaryUrl);
  });
});
