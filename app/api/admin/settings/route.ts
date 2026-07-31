import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) { const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/); return match ? decodeURIComponent(match[1]) : ""; }
async function authorize(request: Request) { const admin = await getAuthenticatedAdminFromToken(tokenFrom(request)); return admin && hasAdminPermission(admin, "canManageSettings") ? admin : null; }

export async function GET(request: Request) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  return NextResponse.json({ success: true, data: await prisma.adminSetting.findMany({ orderBy: { key: "asc" } }) });
}

export async function POST(request: Request) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try { const body = await request.json(); const key = typeof body.key === "string" ? body.key.trim() : ""; const value = typeof body.value === "string" ? body.value : String(body.value ?? ""); if (!key) return NextResponse.json({ success: false, message: "Setting key is required." }, { status: 400 }); const data = await prisma.adminSetting.create({ data: { key, value, description: typeof body.description === "string" ? body.description : null } }); return NextResponse.json({ success: true, data }, { status: 201 }); }
  catch (error) { console.error("[ADMIN] Create setting error:", error); return NextResponse.json({ success: false, message: "Unable to create setting." }, { status: 500 }); }
}
