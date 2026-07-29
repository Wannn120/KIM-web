import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canReadPayments") && !hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const payment = await prisma.payment.findUnique({
      where: { id: paramsResolved.id },
      include: { booking: { select: { id: true, customerName: true, customerPhone: true, bookingDate: true } } },
    });

    if (!payment) return NextResponse.json({ success: false, message: "Payment not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("[ADMIN] Get payment error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve payment." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.status === "string") updates.status = body.status;
    if (typeof body.paymentMethod === "string") updates.paymentMethod = body.paymentMethod;
    if (typeof body.provider === "string") updates.provider = body.provider;
    if (typeof body.transactionId === "string") updates.transactionId = body.transactionId;
    if (typeof body.amount === "number") updates.amount = Math.floor(body.amount);
    if (body.paidAt) updates.paidAt = new Date(String(body.paidAt));
    if (body.expiredAt) updates.expiredAt = new Date(String(body.expiredAt));

    const updated = await prisma.payment.update({ where: { id: paramsResolved.id }, data: updates });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN] Update payment error:", error);
    return NextResponse.json({ success: false, message: "Unable to update payment." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getCookieToken(request);
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManagePayments")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const paramsResolved = await params;
    await prisma.payment.delete({ where: { id: paramsResolved.id } });
    return NextResponse.json({ success: true, message: "Payment deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete payment error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete payment." }, { status: 500 });
  }
}
