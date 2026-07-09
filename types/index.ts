export interface Field {
  id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  size: string;
  rating: number;
  imageUrl?: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface SiteContent {
  locationLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  backgroundImageUrl: string;
  contactEmail: string;
  contactPhone: string;
}

export interface FacilityImage {
  title: string;
  description: string;
  imageUrl: string;
}

export interface StepItem {
  title: string;
  description: string;
}

export interface AdminStat {
  label: string;
  value: string;
}

export interface BookingItem {
  id: string;
  customer: string;
  field: string;
  time: string;
  status: string;
}
