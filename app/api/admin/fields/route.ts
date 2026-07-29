import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const fields = await prisma.field.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data: fields });
  } catch (error) {
    console.error("[ADMIN] Error listing fields:", error);
    return NextResponse.json({ success: false, message: "Unable to list fields." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin-session=([^;]+)/);
    const token = match ? decodeURIComponent(match[1]) : "";
    const admin = await getAuthenticatedAdminFromToken(token);
    if (!admin) return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageFields")) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });

    const body = await request.json();
    const data = {
      name: String(body.name ?? ""),
      location: String(body.location ?? ""),
      description: body.description ?? null,
      price: Number(body.price ?? 0),
      type: String(body.type ?? ""),
      size: String(body.size ?? ""),
      capacity: Number(body.capacity ?? 0),
      facilities: body.facilities ?? null,
      imageUrl: body.imageUrl ?? null,
      cloudinaryPublicId: body.cloudinaryPublicId ?? null,
      isFeatured: !!body.isFeatured,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
      status: body.status ?? "ACTIVE",
    };

    const created = await prisma.field.create({ data });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create field error:", error);
    return NextResponse.json({ success: false, message: "Unable to create field." }, { status: 500 });
  }
}
