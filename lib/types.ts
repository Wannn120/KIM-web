export interface InvoicePayment {
  paidAt?: string | null;
  paymentMethod?: string | null;
  provider?: string | null;
  transactionId?: string | null;
  midtransOrderId?: string | null;
}

export interface BookingRef {
  id?: string | number;
  bookingDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationHours?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  memberId?: string | null;
}

export interface Invoice {
  invoiceNumber?: string | number;
  booking?: BookingRef | null;
  bookingDate?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerMemberId?: string | null;
  fieldName?: string | null;
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  total?: number | null;
  payment?: InvoicePayment | null;
  status?: string | null;
}
