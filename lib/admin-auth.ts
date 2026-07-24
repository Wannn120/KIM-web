import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJwt, verifyJwt, setSecureCookie, clearSecureCookie } from "@/lib/security";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@klatenminisoccer.id";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

export const ADMIN_ROLES = {
  staff: "staff",
  manager: "manager",
  superAdmin: "super_admin",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

function hashSecret(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeAdminRole(role: string): AdminRole {
  const normalized = role.toLowerCase();
  if (normalized === ADMIN_ROLES.manager) return ADMIN_ROLES.manager;
  if (normalized === ADMIN_ROLES.superAdmin) return ADMIN_ROLES.superAdmin;
  return ADMIN_ROLES.staff;
}

export function isAdminRoleAllowed(role: string, allowedRoles: AdminRole[]) {
  const normalizedRole = normalizeAdminRole(role);
  return allowedRoles.includes(normalizedRole);
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
      role: ADMIN_ROLES.superAdmin,
      isActive: true,
    },
  });
}

async function findAdminUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return existing;
  }

  if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    return ensureDefaultAdminUser();
  }

  return null;
}

export async function authenticateAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error("Admin email and password are required.");
  }

  const adminUser = await findAdminUserByEmail(normalizedEmail);

  if (!adminUser) {
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

export async function getAuthenticatedAdminFromToken(token: string) {
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
    role: normalizeAdminRole(session.adminUser.role),
  };
}

export async function getAuthenticatedAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-session")?.value;
  return getAuthenticatedAdminFromToken(token ?? "");
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
