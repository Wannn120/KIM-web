import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJwt, verifyJwt, setSecureCookie, clearSecureCookie } from "@/lib/security";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@klatenminisoccer.id";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

function hashSecret(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function ensureDefaultAdminUser() {
  const passwordHash = hashSecret(DEFAULT_ADMIN_PASSWORD);

  const existing = await prisma.adminUser.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminUser.create({
    data: {
      name: "System Administrator",
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Admin email and password are required.");
  }

  const adminUser = await ensureDefaultAdminUser();

  if (adminUser.email !== normalizedEmail) {
    throw new Error("Admin credentials are invalid.");
  }

  const providedPasswordHash = hashSecret(normalizedPassword);
  if (providedPasswordHash !== adminUser.passwordHash) {
    throw new Error("Admin credentials are invalid.");
  }

  const sessionToken = createJwt({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });

  const tokenHash = hashSecret(sessionToken);

  await prisma.adminSession.create({
    data: {
      adminUserId: adminUser.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });

  return {
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    },
    token: sessionToken,
  };
}

export async function getAuthenticatedAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-session")?.value;
  if (!token) {
    return null;
  }

  const payload = verifyJwt(token);
  if (!payload || typeof payload.sub !== "string") {
    return null;
  }

  const tokenHash = hashSecret(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });

  if (!session || !session.adminUser || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.adminUser.id,
    name: session.adminUser.name,
    email: session.adminUser.email,
    role: session.adminUser.role,
  };
}

export function writeAdminSessionCookie(response: NextResponse, token: string) {
  setSecureCookie(response, "admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  clearSecureCookie(response, "admin-session");
  return response;
}
