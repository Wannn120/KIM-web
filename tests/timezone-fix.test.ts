import { formatJakartaDateTime, formatJakartaDateKey, parseDateOnlyInTimeZone } from "../lib/timezone";

describe("jakarta timezone normalization", () => {
  it("keeps the selected Jakarta date intact when converting date-only values", () => {
    const bookingDate = parseDateOnlyInTimeZone("2026-09-06");

    expect(formatJakartaDateKey(bookingDate)).toBe("2026-09-06");
    expect(new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit", year: "numeric" }).format(bookingDate)).toBe("06/09/2026");
  });

  it("renders booking time in Jakarta WIB format for notifications and display", () => {
    expect(formatJakartaDateTime("2026-09-06", "10:00")).toBe("06-09-2026 10:00 WIB");
    expect(formatJakartaDateTime("2026-09-06", "03:00")).toBe("06-09-2026 03:00 WIB");
  });
});
