import type { AdminStat, BookingItem, Field, StepItem } from "@/types";

export const fields: Field[] = [
  {
    id: "elite-1",
    name: "Elite Turf 1",
    location: "Jakarta Selatan",
    price: 180000,
    type: "Indoor",
    size: "5v5",
    rating: 4.9,
  },
  {
    id: "elite-2",
    name: "Elite Turf 2",
    location: "Bandung",
    price: 150000,
    type: "Outdoor",
    size: "7v7",
    rating: 4.8,
  },
  {
    id: "club-3",
    name: "Club Arena",
    location: "Surabaya",
    price: 220000,
    type: "Indoor",
    size: "7v7",
    rating: 5.0,
  },
];

export const bookingSteps: StepItem[] = [
  { title: "Choose a field", description: "Browse the best venues near you." },
  { title: "Pick date and time", description: "Select your preferred slot instantly." },
  { title: "Confirm and pay", description: "Secure payment with Midtrans and instant confirmation." },
];

export const adminStats: AdminStat[] = [
  { label: "Today bookings", value: "24" },
  { label: "Active fields", value: "8" },
  { label: "Revenue", value: "Rp 18.4M" },
  { label: "Pending reviews", value: "3" },
];

export const recentBookings: BookingItem[] = [
  { id: "BK-1042", customer: "Ari P", field: "Elite Turf 1", time: "Today • 19:00", status: "Confirmed" },
  { id: "BK-1041", customer: "Rina S", field: "Club Arena", time: "Today • 20:30", status: "Pending" },
  { id: "BK-1040", customer: "Bima K", field: "Elite Turf 2", time: "Tomorrow • 18:00", status: "Confirmed" },
];
