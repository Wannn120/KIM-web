import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUuid } from "@/lib/payment-utils";

/**
 * GET /api/payments/audit
 * Query payment audit trail by transactionId or bookingId
 * 
 * Usage:
 * - /api/payments/audit?transactionId=xxx → Shows complete payment and booking history
 * - /api/payments/audit?bookingId=xxx → Shows complete payment and booking history for booking
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId")?.trim() ?? "";
  const bookingId = url.searchParams.get("bookingId")?.trim() ?? "";

  if (!transactionId && !bookingId) {
    return NextResponse.json(
      { success: false, error: "transactionId or bookingId is required." },
      { status: 400 }
    );
  }

  try {
    let payment = null;
    let booking = null;

    if (transactionId) {
      payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: {
          booking: true,
          invoice: true,
        },
      });

      if (!payment) {
        return NextResponse.json(
          { success: false, error: "Payment record not found." },
          { status: 404 }
        );
      }

      booking = payment.booking;
    } else if (bookingId) {
      if (!isUuid(bookingId)) {
        return NextResponse.json(
          { success: false, error: "Invalid bookingId format." },
          { status: 400 }
        );
      }

      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: "Booking record not found." },
          { status: 404 }
        );
      }

      payment = await prisma.payment.findFirst({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
        include: {
          invoice: true,
        },
      });
    }

    // Build audit response
    const auditData = {
      payment: payment
        ? {
            id: payment.id,
            transactionId: payment.transactionId,
            bookingId: payment.bookingId,
            amount: payment.amount,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            provider: payment.provider,
            snapToken: payment.snapToken ? "[TOKEN_PRESENT]" : null,
            snapUrl: payment.snapUrl,
            paidAt: payment.paidAt,
            expiredAt: payment.expiredAt,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            invoice: payment.invoice
              ? {
                  id: payment.invoice.id,
                  invoiceNumber: payment.invoice.invoiceNumber,
                  status: payment.invoice.status,
                  paidAt: payment.invoice.paidAt,
                  createdAt: payment.invoice.createdAt,
                  updatedAt: payment.invoice.updatedAt,
                }
              : null,
          }
        : null,
      booking: booking
        ? {
            id: booking.id,
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status,
            totalPrice: booking.totalPrice,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
          }
        : null,
      summary: {
        isPaymentSuccessful: payment?.status === "success",
        isPaymentFailed: ["failed", "expired", "cancelled"].includes(payment?.status ?? ""),
        isPaymentPending: payment?.status === "pending",
        isBookingConfirmed: booking?.status === "confirmed",
        isBookingCancelled: booking?.status === "cancelled",
        slotIsBlocked: booking?.status === "confirmed" || booking?.status === "completed",
        dbSyncStatus: {
          paymentStatusMatches: payment?.status === booking?.status?.replace("confirmed", "success")?.replace("cancelled", "failed") ? "PARTIAL" : "CHECK",
          lastPaymentUpdate: payment?.updatedAt,
          lastBookingUpdate: booking?.updatedAt,
          timeSinceLastUpdate: payment?.updatedAt
            ? Math.round((Date.now() - payment.updatedAt.getTime()) / 1000)
            : null,
        },
      },
    };

    return NextResponse.json({ success: true, audit: auditData });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[AUDIT] Payment audit error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      transactionId,
      bookingId,
    });
    return NextResponse.json(
      { success: false, error: `Audit failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
