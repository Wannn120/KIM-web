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
    if (!hasAdminPermission(admin, "canReadFields") && !hasAdminPermission(admin, "canManageFields")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
    const limit = Math.max(Number(url.searchParams.get("limit") || "6"), 1);
    const q = (url.searchParams.get("q") || "").trim();
    const status = url.searchParams.get("status") || undefined;

    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { location: { contains: q, mode: "insensitive" } }];
    if (status) where.status = status;

    const total = await prisma.field.count({ where });
    const fields = await prisma.field.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit });
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    return NextResponse.json({ success: true, data: fields, total, page, limit, totalPages });
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
