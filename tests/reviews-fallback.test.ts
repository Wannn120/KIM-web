import { getFallbackReviews } from "@/lib/mock-data";

describe("reviews fallback data", () => {
  it("returns seeded reviews when the database is unavailable", () => {
    const reviews = getFallbackReviews();

    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0]).toEqual(
      expect.objectContaining({
        customerName: expect.any(String),
        rating: expect.any(Number),
        comment: expect.any(String),
      }),
    );
  });
});
