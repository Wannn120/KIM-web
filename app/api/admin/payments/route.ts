import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadPayments") && !hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        booking: { select: { id: true, customerName: true, customerPhone: true, bookingDate: true } },
      },
    });

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("[ADMIN] Payment list error:", error);
    return NextResponse.json({ success: false, message: "Unable to list payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const body = await request.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
    const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0);
    const status = typeof body.status === "string" ? body.status : "pending";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "Midtrans";
    const provider = typeof body.provider === "string" ? body.provider : "Midtrans";

    if (!bookingId || !transactionId || amount <= 0) {
      return NextResponse.json({ success: false, message: "Missing required payment details." }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        transactionId,
        amount: Math.floor(amount),
        paymentMethod,
        provider,
        status,
        paidAt: status === "success" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create payment error:", error);
    return NextResponse.json({ success: false, message: "Unable to create payment." }, { status: 500 });
  }
}
