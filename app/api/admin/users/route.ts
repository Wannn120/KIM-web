import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function hash(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
async function authorize(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  return admin && hasAdminPermission(admin, "canManageAdmins") ? admin : null;
}

export async function GET(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  const data = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const admin = await authorize(request);
  if (!admin) return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "super_admin" || body.role === "manager" || body.role === "staff" ? body.role : "staff";
    if (!name || !email || password.length < 6) return NextResponse.json({ success: false, message: "Name, email, and a password of at least 6 characters are required." }, { status: 400 });
    const data = await prisma.adminUser.create({ data: { name, email, passwordHash: hash(password), role, isActive: body.isActive !== false }, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN] Create admin user error:", error);
    return NextResponse.json({ success: false, message: "Unable to create admin user." }, { status: 500 });
  }
}
