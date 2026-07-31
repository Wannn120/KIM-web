import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  return admin && hasAdminPermission(admin, "canManageAdmins") ? admin : null;
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Superadmin access required." }, { status: 403 });
  const data = await prisma.venueFeature.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Superadmin access required." }, { status: 403 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!name || !description || !imageUrl) return NextResponse.json({ success: false, message: "Name, description, and image are required." }, { status: 400 });
    const last = await prisma.venueFeature.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const data = await prisma.venueFeature.create({ data: { name, description, imageUrl, imagePublicId: typeof body.imagePublicId === "string" ? body.imagePublicId : null, sortOrder: (last?.sortOrder ?? -1) + 1 } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) { console.error("[ADMIN] Create venue feature error:", error); return NextResponse.json({ success: false, message: "Unable to create venue feature." }, { status: 500 }); }
}
