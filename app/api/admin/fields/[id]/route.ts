import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const paramsResolved = await params;
    const id = paramsResolved.id;
    const field = await prisma.field.findUnique({ where: { id } });
    if (!field) return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: field });
  } catch (error) {
    console.error("[ADMIN] Get field error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve field." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const paramsResolved = await params;
    const id = paramsResolved.id;
    const body = await request.json();
    const updates: {
      name?: string;
      location?: string;
      description?: string | null;
      price?: number;
      type?: string;
      size?: string;
      capacity?: number;
      facilities?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
      imageUrl?: string | null;
      cloudinaryPublicId?: string | null;
      isFeatured?: boolean;
      isActive?: boolean;
      status?: string;
    } = {};

    if (body.name !== undefined) updates.name = String(body.name);
    if (body.location !== undefined) updates.location = String(body.location);
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.type !== undefined) updates.type = String(body.type);
    if (body.size !== undefined) updates.size = String(body.size);
    if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
    if (body.facilities !== undefined) updates.facilities = body.facilities === null ? Prisma.JsonNull : body.facilities;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.cloudinaryPublicId !== undefined) updates.cloudinaryPublicId = body.cloudinaryPublicId;
    if (body.isFeatured !== undefined) updates.isFeatured = !!body.isFeatured;
    if (body.isActive !== undefined) updates.isActive = !!body.isActive;
    if (body.status !== undefined) updates.status = String(body.status);

    const updated = await prisma.field.update({ where: { id }, data: updates as unknown as Prisma.FieldUpdateInput });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN] Update field error:", error);
    return NextResponse.json({ success: false, message: "Unable to update field." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const paramsResolved = await params;
    const id = paramsResolved.id;
    await prisma.field.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Field deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete field error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete field." }, { status: 500 });
  }
}
