import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcilePaymentStatus } from "@/lib/payment-service";
import { isUuid } from "@/lib/payment-utils";

/**
 * POST /api/payments/sync-status
 * 
 * Manually sync payment status from Midtrans to database
 * This is a failover endpoint in case webhooks are missed
 * 
 * Usage:
 * - POST with { transactionId: "xxx" } → Fetches status from Midtrans and updates DB
 * 
 * Returns audit trail showing what was updated
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, bookingId } = body;

    if (!transactionId && !bookingId) {
      return NextResponse.json(
        { success: false, error: "transactionId or bookingId is required." },
        { status: 400 }
      );
    }

    let payment = null;

    if (transactionId) {
      payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: { booking: true },
      });
    } else if (bookingId) {
      if (!isUuid(bookingId)) {
        return NextResponse.json(
          { success: false, error: "Invalid bookingId format." },
          { status: 400 }
        );
      }

      payment = await prisma.payment.findFirst({
        where: { bookingId },
        orderBy: { createdAt: "desc" },
        include: { booking: true },
      });
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found." },
        { status: 404 }
      );
    }

    // Log current status before sync
    const previousStatus = payment.status;
    const previousBookingStatus = payment.booking?.status;

    try {
      const syncedStatus = await reconcilePaymentStatus(payment.transactionId, payment.status);

      const updatedPayment = await prisma.payment.findUnique({
        where: { transactionId: payment.transactionId },
        include: { booking: true },
      });

      const syncResult = {
        success: true,
        message: "Payment status synced with database",
        paymentId: payment.id,
        transactionId: payment.transactionId,
        bookingId: payment.bookingId,
        previousStatus,
        currentStatus: updatedPayment?.status,
        reconciledStatus: syncedStatus,
        statusChanged: previousStatus !== updatedPayment?.status,
        previousBookingStatus,
        currentBookingStatus: updatedPayment?.booking?.status,
        bookingStatusChanged: previousBookingStatus !== updatedPayment?.booking?.status,
        timestamp: new Date().toISOString(),
        details: {
          payment: updatedPayment
            ? {
                status: updatedPayment.status,
                paidAt: updatedPayment.paidAt,
                expiredAt: updatedPayment.expiredAt,
                updatedAt: updatedPayment.updatedAt,
              }
            : null,
          booking: updatedPayment?.booking
            ? {
                status: updatedPayment.booking.status,
                updatedAt: updatedPayment.booking.updatedAt,
              }
            : null,
        },
      };

      return NextResponse.json({ success: true, result: syncResult });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // If sync fails, return current state for debugging
      return NextResponse.json(
        {
          success: false,
          error: `Sync failed: ${errorMsg}`,
          currentState: {
            transactionId: payment.transactionId,
            paymentStatus: payment.status,
            bookingStatus: payment.booking?.status,
            lastUpdated: payment.updatedAt,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[SYNC] Payment sync error:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, error: `Sync error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
