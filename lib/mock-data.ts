import type { AdminStat, BookingItem, Field, FacilityImage, SiteContent, StepItem } from "@/types";
import type { Review } from "@/types";

export const siteContent: SiteContent = {
  locationLabel: "Klaten, Jawa Tengah",
  heroTitle: "Klaten International Minisoccer",
  heroSubtitle:
    "Satu lapangan premium dengan jadwal per jam, booking mudah, dan suasana lapangan terbaik untuk komunitas futsal dan mini soccer.",
  ctaPrimary: "Pesan sekarang",
  ctaSecondary: "Lihat riwayat booking",
  backgroundImageUrl:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  contactEmail: "info@klatenminisoccer.id",
  contactPhone: "+62 821-1234-5678",
};

export const facilityImages: FacilityImage[] = [
  {
    title: "Lapangan premium",
    description: "Surface terbaik untuk 5v5 dan mini soccer.",
    imageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Lampu malam",
    description: "Jadwal per jam hingga malam hari.",
    imageUrl: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Fasilitas sewa",
    description: "Sepatu, bola, dan ruang ganti rapi.",
    imageUrl: "https://images.unsplash.com/photo-1502355972-2231b2794a2d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Citarasa komunitas",
    description: "Tempat berkumpul dan pertandingan seru.",
    imageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1000&q=80",
  },
];

export const fields: Field[] = [
  {
    id: "klaten-field-1",
    name: "Lapangan Klaten International",
    location: "Klaten",
    price: 110000,
    type: "Mini Soccer",
    size: "5v5",
    rating: 4.9,
    imageUrl:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  },
];

export const bookingSteps: StepItem[] = [
  { title: "Pilih jam", description: "Lihat slot per jam untuk satu lapangan premium." },
  { title: "Isi data pemain", description: "Masukkan informasi tim atau nama captain." },
  { title: "Bayar & konfirmasi", description: "Pembayaran cepat, SMS konfirmasi langsung." },
];

export const bookedSlots = [
  { date: "2026-07-07", time: "19:00 - 20:00", field: "Lapangan Klaten International", status: "Booked" },
  { date: "2026-07-08", time: "18:00 - 19:00", field: "Lapangan Klaten International", status: "Booked" },
  { date: "2026-07-09", time: "16:00 - 17:00", field: "Lapangan Klaten International", status: "Booked" },
];

export const reviews: Review[] = [
  {
    id: "review-1",
    customerName: "Ari Putra",
    rating: 5,
    comment: "Lapangan bersih, proses booking cepat, dan pembayaran aman. Recommended!",
    date: "12 Jul 2026",
  },
  {
    id: "review-2",
    customerName: "Nina Sari",
    rating: 4,
    comment: "Fasilitas bagus, tetapi parkir bisa lebih rapi. Secara keseluruhan memuaskan.",
    date: "09 Jul 2026",
  },
  {
    id: "review-3",
    customerName: "Bima Kusuma",
    rating: 5,
    comment: "Sangat nyaman bermain di sini. Coba lapangan Klaten International!",
    date: "05 Jul 2026",
  },
];

export const adminStats: AdminStat[] = [
  { label: "Today bookings", value: "24" },
  { label: "Active field", value: "1" },
  { label: "Revenue", value: "Rp 18.4M" },
  { label: "Pending reviews", value: "3" },
];

export const recentBookings: BookingItem[] = [
  { id: "BK-1042", customer: "Ari P", field: "Lapangan Klaten International", time: "Today • 19:00", status: "Confirmed" },
  { id: "BK-1041", customer: "Rina S", field: "Lapangan Klaten International", time: "Today • 20:30", status: "Pending" },
  { id: "BK-1040", customer: "Bima K", field: "Lapangan Klaten International", time: "Tomorrow • 18:00", status: "Confirmed" },
];
