import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) { const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/); return match ? decodeURIComponent(match[1]) : ""; }
async function authorize(request: Request) { const admin = await getAuthenticatedAdminFromToken(tokenFrom(request)); return admin && hasAdminPermission(admin, "canManageAdmins") ? admin : null; }

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Superadmin access required." }, { status: 403 });
  try {
    const { id } = await params; const body = await request.json();
    const data = await prisma.venueFeature.update({ where: { id }, data: {
      ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
      ...(typeof body.description === "string" ? { description: body.description.trim() } : {}),
      ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl.trim() } : {}),
      ...(typeof body.imagePublicId === "string" ? { imagePublicId: body.imagePublicId } : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: Math.max(0, Math.floor(Number(body.sortOrder))) } : {}),
    } });
    return NextResponse.json({ success: true, data });
  } catch (error) { console.error("[ADMIN] Update venue feature error:", error); return NextResponse.json({ success: false, message: "Unable to update venue feature." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Superadmin access required." }, { status: 403 });
  try { const { id } = await params; await prisma.venueFeature.delete({ where: { id } }); return NextResponse.json({ success: true, message: "Venue feature deleted." }); }
  catch (error) { console.error("[ADMIN] Delete venue feature error:", error); return NextResponse.json({ success: false, message: "Unable to delete venue feature." }, { status: 500 }); }
}
