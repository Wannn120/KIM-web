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
  const allowed = manage ? hasAdminPermission(admin, "canManageInvoices") : hasAdminPermission(admin, "canReadInvoices") || hasAdminPermission(admin, "canManageInvoices");
  return allowed ? admin : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const { id } = await params;
  const data = await prisma.invoice.findUnique({ where: { id }, include: { booking: true, payment: true } });
  return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request, true);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of ["invoiceNumber", "customerName", "customerEmail", "customerPhone", "status"] as const) if (typeof body[key] === "string") updates[key] = body[key].trim();
    for (const key of ["subtotal", "tax", "discount", "total"] as const) if (body[key] !== undefined) updates[key] = Math.floor(Number(body[key]));
    if (body.paidAt !== undefined) updates.paidAt = body.paidAt ? new Date(String(body.paidAt)) : null;
    const data = await prisma.invoice.update({ where: { id }, data: updates, include: { booking: true, payment: true } });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ADMIN] Update invoice error:", error);
    return NextResponse.json({ success: false, message: "Unable to update invoice." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request, true);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Invoice deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete invoice error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete invoice." }, { status: 500 });
  }
}
