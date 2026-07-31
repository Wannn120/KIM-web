import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request, manage = false) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  if (!admin) return null;
  const allowed = manage ? hasAdminPermission(admin, "canManageReviews") : hasAdminPermission(admin, "canReadReviews") || hasAdminPermission(admin, "canManageReviews");
  return allowed ? admin : null;
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const data = await prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { booking: true } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await authorize(request, true);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const body = await request.json();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const rating = Math.round(Number(body.rating));
    if (!customerName || !comment || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ success: false, message: "Valid customerName, rating, and comment are required." }, { status: 400 });
    if (body.bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: String(body.bookingId) }, select: { id: true } });
      if (!booking) return NextResponse.json({ success: false, message: "Booking not found." }, { status: 404 });
    }
    const data = await prisma.review.create({ data: { customerName, comment, rating, bookingId: body.bookingId ? String(body.bookingId) : null } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create review error:", error);
    return NextResponse.json({ success: false, message: "Unable to create review." }, { status: 500 });
  }
}
