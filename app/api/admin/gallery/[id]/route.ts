import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  return admin && hasAdminPermission(admin, "canManageGallery") ? admin : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await prisma.venueGallery.update({
      where: { id },
      data: {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl.trim() } : {}),
        ...(typeof body.imagePublicId === "string" ? { imagePublicId: body.imagePublicId } : {}),
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: Math.max(0, Math.floor(Number(body.sortOrder))) } : {}),
      },
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ADMIN] Update gallery item error:", error);
    return NextResponse.json({ success: false, message: "Unable to update gallery item." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const { id } = await params;
    await prisma.venueGallery.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Gallery item deleted." });
  } catch (error) {
    console.error("[ADMIN] Delete gallery item error:", error);
    return NextResponse.json({ success: false, message: "Unable to delete gallery item." }, { status: 500 });
  }
}
