export interface Field {
  id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  size: string;
  rating: number;
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
