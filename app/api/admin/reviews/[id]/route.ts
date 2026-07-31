import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  return admin && hasAdminPermission(admin, "canManageReviews") ? admin : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const { id } = await params;
  const data = await prisma.review.findUnique({ where: { id }, include: { booking: true } });
  return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, message: "Review not found." }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.customerName === "string") updates.customerName = body.customerName.trim();
    if (typeof body.comment === "string") updates.comment = body.comment.trim();
    if (body.rating !== undefined) updates.rating = Math.round(Number(body.rating));
    if (body.bookingId !== undefined) updates.bookingId = body.bookingId ? String(body.bookingId) : null;
    if (typeof updates.rating === "number" && (updates.rating < 1 || updates.rating > 5)) return NextResponse.json({ success: false, message: "Rating must be between 1 and 5." }, { status: 400 });
    const data = await prisma.review.update({ where: { id }, data: updates });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ADMIN] Update review error:", error);
    return NextResponse.json({ success: false, message: "Unable to update review." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete review error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete review." }, { status: 500 });
  }
}
