import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, hasAdminPermission } from "@/lib/admin-auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const field = await prisma.field.findUnique({ where: { id } });
    if (!field) return NextResponse.json({ success: false, message: "Field not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: field });
  } catch (error) {
    console.error("[ADMIN] Get field error:", error);
    return NextResponse.json({ success: false, message: "Unable to retrieve field." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const id = params.id;
    const body = await request.json();
    const updates = {
      name: body.name ?? undefined,
      location: body.location ?? undefined,
      description: body.description ?? undefined,
      price: body.price ?? undefined,
      type: body.type ?? undefined,
      size: body.size ?? undefined,
      capacity: body.capacity ?? undefined,
      facilities: body.facilities ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      cloudinaryPublicId: body.cloudinaryPublicId ?? undefined,
      isFeatured: body.isFeatured ?? undefined,
      isActive: body.isActive ?? undefined,
      status: body.status ?? undefined,
    };

    const updated = await prisma.field.update({ where: { id }, data: updates as any });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN] Update field error:", error);
    return NextResponse.json({ success: false, message: "Unable to update field." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const id = params.id;
    await prisma.field.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Field deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete field error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete field." }, { status: 500 });
  }
}
