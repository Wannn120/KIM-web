export interface AdminSummary {
  revenueToday: number;
  revenueThisMonth: number;
  bookingsToday: number;
  bookingsThisMonth: number;
  peakHours: Array<{ hour: string; bookings: number }>;
  mostBookedField: { name: string; bookings: number };
  customerStats: { totalCustomers: number; activeCustomers: number; newCustomersThisMonth: number };
  calendarEvents: Array<{ title: string; date: string; field: string }>;
}

export function getAdminSummary(): AdminSummary {
  return {
    revenueToday: 1800000,
    revenueThisMonth: 18400000,
    bookingsToday: 24,
    bookingsThisMonth: 182,
    peakHours: [
      { hour: "18:00", bookings: 12 },
      { hour: "19:00", bookings: 15 },
      { hour: "20:00", bookings: 10 },
      { hour: "21:00", bookings: 8 },
    ],
    mostBookedField: { name: "Elite Turf 1", bookings: 64 },
    customerStats: {
      totalCustomers: 438,
      activeCustomers: 312,
      newCustomersThisMonth: 27,
    },
    calendarEvents: [
      { title: "Morning league", date: "2026-07-07", field: "Elite Turf 1" },
      { title: "Training session", date: "2026-07-08", field: "Club Arena" },
      { title: "Tournament", date: "2026-07-09", field: "Elite Turf 2" },
    ],
  };
}
