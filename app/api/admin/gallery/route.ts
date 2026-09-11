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
  const allowed = manage
    ? hasAdminPermission(admin, "canManageGallery")
    : hasAdminPermission(admin, "canReadGallery") || hasAdminPermission(admin, "canManageGallery");
  return allowed ? admin : null;
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const data = await prisma.venueGallery.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await authorize(request, true);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!title || !imageUrl) return NextResponse.json({ success: false, message: "Title and image URL are required." }, { status: 400 });
    const last = await prisma.venueGallery.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const data = await prisma.venueGallery.create({
      data: {
        title,
        imageUrl,
        imagePublicId: typeof body.imagePublicId === "string" ? body.imagePublicId : null,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create gallery item error:", error);
    return NextResponse.json({ success: false, message: "Unable to create gallery item." }, { status: 500 });
  }
}
