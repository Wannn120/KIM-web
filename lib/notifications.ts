import { Resend } from "resend";

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

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function buildMessage(event: NotificationEvent, payload: NotificationPayload) {
  const customerName = payload.customerName ?? "Guest";
  const bookingId = payload.bookingId ?? payload.orderId ?? "N/A";

  switch (event) {
    case "email-confirmation":
      return {
        channel: "email" as const,
        message: `Hi ${customerName}, your booking ${bookingId} has been confirmed for ${payload.fieldName ?? "the selected field"}.`,
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

function getEmailSubject(event: NotificationEvent) {
  switch (event) {
    case "email-confirmation":
      return "Booking confirmed";
    case "payment-reminder":
      return "Payment reminder";
    case "booking-cancelled":
      return "Booking cancelled";
    default:
      return "Notification from MiniSoccer";
  }
}

async function sendEmail(event: NotificationEvent, payload: NotificationPayload) {
  const to = payload.email;
  const from = process.env.RESEND_FROM_EMAIL;
  const resendClient = getResendClient();

  if (!to || !from) {
    throw new Error("Missing email recipient or sender configuration.");
  }

  if (!resendClient) {
    throw new Error("Resend API key is not configured.");
  }

  const { message } = buildMessage(event, payload);
  const subject = getEmailSubject(event);

  const body = event === "email-confirmation"
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">Booking Confirmed</h2>
        <p>${message}</p>
        <p><strong>Customer:</strong> ${payload.customerName ?? "Guest"}</p>
        <p><strong>Field:</strong> ${payload.fieldName ?? "N/A"}</p>
        <p><strong>Schedule:</strong> ${payload.startAt ?? "N/A"} - ${payload.endAt ?? "N/A"}</p>
        <p><strong>Amount:</strong> Rp ${payload.amount?.toLocaleString("id-ID") ?? "0"}</p>
        <p><strong>Booking ID:</strong> ${payload.bookingId ?? "N/A"}</p>
      </div>`
    : `<p>${message}</p>`;

  await resendClient.emails.send({
    from,
    to,
    subject,
    html: body,
  });
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

  if (channel === "email") {
    try {
      await sendEmail(event, payload);
      result.provider = "resend";
    } catch (error) {
      return {
        ...result,
        success: false,
        message: `Resend email failed: ${(error as Error).message}`,
      };
    }
  }

  notificationHistory.push(result);
  return result;
}

export function getNotificationHistory() {
  return [...notificationHistory].reverse();
}
