import { getSafeRemoteImageUrl, normalizeRemoteImageUrl } from "@/lib/remote-image";

describe("image fallback helpers", () => {
  it("normalizes whitespace and newlines from remote image URLs", () => {
    expect(normalizeRemoteImageUrl(" https://example.com/a.jpg\n\r\t ")).toBe("https://example.com/a.jpg");
  });

  it("returns a valid fallback image when the database value is missing or invalid", () => {
    const fallback = ["https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80"];
    expect(getSafeRemoteImageUrl("", fallback)).toBe(fallback[0]);
    expect(getSafeRemoteImageUrl("not-a-url", fallback)).toBe(fallback[0]);
  });
});
