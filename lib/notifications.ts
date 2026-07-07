export type NotificationEvent =
  | "email-confirmation"
  | "whatsapp-confirmation"
  | "booking-reminder"
  | "payment-reminder"
  | "booking-cancelled"
  | "refund-processed";

export type NotificationChannel = "email" | "whatsapp";

export interface NotificationPayload {
  customerName?: string;
  email?: string;
  phone?: string;
  bookingId?: string;
  fieldName?: string;
  startAt?: string;
  endAt?: string;
  amount?: number;
  orderId?: string;
  reason?: string;
}

export interface NotificationResult {
  success: boolean;
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  message: string;
  provider: string;
  queuedAt: string;
}

const notificationHistory: NotificationResult[] = [];

function buildMessage(event: NotificationEvent, payload: NotificationPayload) {
  const customerName = payload.customerName ?? "Guest";
  const bookingId = payload.bookingId ?? payload.orderId ?? "N/A";

  switch (event) {
    case "email-confirmation":
      return {
        channel: "email" as const,
        message: `Email sent to ${payload.email ?? "customer@example.com"}: Hi ${customerName}, your booking ${bookingId} has been confirmed for ${payload.fieldName ?? "the selected field"}.`,
      };
    case "whatsapp-confirmation":
      return {
        channel: "whatsapp" as const,
        message: `WhatsApp sent to ${payload.phone ?? "+628000000000"}: Hi ${customerName}, your booking ${bookingId} is confirmed.`,
      };
    case "booking-reminder":
      return {
        channel: "whatsapp" as const,
        message: `Reminder: ${customerName}, your booking ${bookingId} is scheduled for ${payload.startAt ?? "soon"}.`,
      };
    case "payment-reminder":
      return {
        channel: "email" as const,
        message: `Payment reminder: ${customerName}, please complete payment for order ${bookingId} before it expires.`,
      };
    case "booking-cancelled":
      return {
        channel: "email" as const,
        message: `Booking ${bookingId} has been cancelled${payload.reason ? ` because ${payload.reason}` : ""}.`,
      };
    case "refund-processed":
      return {
        channel: "whatsapp" as const,
        message: `Refund processed for ${customerName} for order ${bookingId}.`,
      };
    default:
      return {
        channel: "email" as const,
        message: `Notification sent for ${event}.`,
      };
  }
}

export async function sendNotification(event: NotificationEvent, payload: NotificationPayload): Promise<NotificationResult> {
  const { channel, message } = buildMessage(event, payload);
  const result: NotificationResult = {
    success: true,
    id: `notification-${Date.now()}`,
    event,
    channel,
    message,
    provider: "demo-notifier",
    queuedAt: new Date().toISOString(),
  };

  notificationHistory.push(result);
  return result;
}

export function getNotificationHistory() {
  return [...notificationHistory].reverse();
}
