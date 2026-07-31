import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) { const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/); return match ? decodeURIComponent(match[1]) : ""; }
async function authorize(request: Request) { const admin = await getAuthenticatedAdminFromToken(tokenFrom(request)); return admin && hasAdminPermission(admin, "canManageSettings") ? admin : null; }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 }); const { id } = await params; const data = await prisma.adminSetting.findUnique({ where: { id } }); return data ? NextResponse.json({ success: true, data }) : NextResponse.json({ success: false, message: "Setting not found." }, { status: 404 }); }

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try { const { id } = await params; const body = await request.json(); const data = await prisma.adminSetting.update({ where: { id }, data: { ...(typeof body.key === "string" ? { key: body.key.trim() } : {}), ...(body.value !== undefined ? { value: String(body.value) } : {}), ...(body.description !== undefined ? { description: body.description ? String(body.description) : null } : {}) } }); return NextResponse.json({ success: true, data }); }
  catch (error) { console.error("[ADMIN] Update setting error:", error); return NextResponse.json({ success: false, message: "Unable to update setting." }, { status: 500 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { const admin = await authorize(request); if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 }); try { const { id } = await params; await prisma.adminSetting.delete({ where: { id } }); return NextResponse.json({ success: true, message: "Setting deleted." }); } catch (error) { console.error("[ADMIN] Delete setting error:", error); return NextResponse.json({ success: false, message: "Unable to delete setting." }, { status: 500 }); } }
