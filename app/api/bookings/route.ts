import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "@/lib/audit-log";
import { getRateLimitResult, sanitizeObject, applySecurityHeaders } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const fieldId = typeof safeBody?.fieldId === "string" ? safeBody.fieldId : "";
    const bookingDate = typeof safeBody?.bookingDate === "string" ? safeBody.bookingDate : "";
    const startTime = typeof safeBody?.startTime === "string" ? safeBody.startTime : "";
    const endTime = typeof safeBody?.endTime === "string" ? safeBody.endTime : "";
    const bodyCustomerName = typeof safeBody?.customerName === "string" ? safeBody.customerName.trim() : "";
    const bodyCustomerPhone = typeof safeBody?.customerPhone === "string" ? safeBody.customerPhone.trim() : "";
    const bodyCustomerEmail = typeof safeBody?.customerEmail === "string" ? safeBody.customerEmail.trim() : "";
    const clientIp = request.headers.get("x-forwarded-for") ?? "unknown";

    const rateLimit = getRateLimitResult(`booking:${clientIp}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, message: "Too many booking attempts. Please try again later." }, { status: 429 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { name: true, email: true, phone: true },
    });

    const customerName = bodyCustomerName || userRecord?.name || "";
    const customerPhone = bodyCustomerPhone || userRecord?.phone || "";
    const customerEmail = bodyCustomerEmail || userRecord?.email || "";

    if (!fieldId || !bookingDate || !startTime || !endTime || !customerName) {
      return NextResponse.json({ success: false, message: "Missing required booking details." }, { status: 400 });
    }

    // Get field details for pricing
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, price: true },
    });

    if (!field) {
      return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    }

    // Check if slot is available
    const schedule = await prisma.fieldSchedule.findFirst({
      where: {
        fieldId,
        date: new Date(bookingDate),
        startTime,
        endTime,
      },
    });

    if (!schedule || !schedule.isAvailable) {
      return NextResponse.json({ success: false, message: "This time slot is not available." }, { status: 409 });
    }

    // Calculate duration and total price
    const startHour = parseInt(startTime.split(":")[0]);
    const endHour = parseInt(endTime.split(":")[0]);
    const durationHours = endHour - startHour;
    const totalPrice = field.price * durationHours;

    // Create booking and update schedule in transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: auth.user.sub,
          fieldId,
          bookingDate: new Date(bookingDate),
          startTime,
          endTime,
          durationHours,
          totalPrice,
          customerName,
          customerPhone,
          customerEmail,
          status: "pending",
        },
        select: {
          id: true,
          fieldId: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          totalPrice: true,
          status: true,
          createdAt: true,
        },
      });

      // Update schedule to mark slot as unavailable
      await tx.fieldSchedule.update({
        where: { id: schedule.id },
        data: { isAvailable: false },
      });

      return newBooking;
    });

    auditLog("booking-created", `Booking ${booking.id} created for ${field.name}`, auth.user.sub, clientIp);

    const response = NextResponse.json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });

    return applySecurityHeaders(response);
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create booking." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: auth.user.sub },
      include: {
        field: {
          select: {
            id: true,
            name: true,
            location: true,
            imageUrl: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            transactionId: true,
            status: true,
            amount: true,
            provider: true,
            paymentMethod: true,
            createdAt: true,
            updatedAt: true,
            paidAt: true,
            expiredAt: true,
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch bookings." },
      { status: 500 }
    );
  }
}
