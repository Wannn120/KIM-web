import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createJwt, verifyJwt, setSecureCookie, clearSecureCookie } from "@/lib/security";
import { Prisma } from "@prisma/client";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@klatenminisoccer.id";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

const SEEDED_ADMIN_CREDENTIALS = [
  {
    name: "System Administrator",
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    password: DEFAULT_ADMIN_PASSWORD,
    role: "super_admin" as const,
  },
  {
    name: "Primary Super Admin",
    email: "superadmin1@klatenminisoccer.id",
    password: "superadmin123",
    role: "super_admin" as const,
  },
  {
    name: "Booking Manager",
    email: "manager1@klatenminisoccer.id",
    password: "manager123",
    role: "manager" as const,
  },
  {
    name: "Support Staff",
    email: "staff@klatenminisoccer.id",
    password: "staff123",
    role: "staff" as const,
  },
];

export const ADMIN_ROLES = {
  staff: "staff",
  manager: "manager",
  superAdmin: "super_admin",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export interface AdminPermissions {
  canManageFields: boolean;
  canReadFields: boolean;
  canManageBookings: boolean;
  canReadBookings: boolean;
  canManagePayments: boolean;
  canReadPayments: boolean;
  canManageSchedule: boolean;
  canManageCMS: boolean;
  canManageAdmins: boolean;
  canViewReports: boolean;
  canVerifyPayments: boolean;
  canCreateBookings: boolean;
  canManageSettings: boolean;
}

export interface AuthenticatedAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
}

function hashSecret(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeAdminRole(role: string): AdminRole {
  const normalized = role.toLowerCase();
  if (normalized === ADMIN_ROLES.manager) return ADMIN_ROLES.manager;
  if (normalized === ADMIN_ROLES.superAdmin) return ADMIN_ROLES.superAdmin;
  return ADMIN_ROLES.staff;
}

function getDefaultPermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case ADMIN_ROLES.superAdmin:
      return {
        canManageFields: true,
        canReadFields: true,
        canManageBookings: true,
        canReadBookings: true,
        canManagePayments: true,
        canReadPayments: true,
        canManageSchedule: true,
        canManageCMS: true,
        canManageAdmins: true,
        canViewReports: true,
        canVerifyPayments: true,
        canCreateBookings: true,
        canManageSettings: true,
      };
    case ADMIN_ROLES.manager:
      return {
        canManageFields: true,
        canReadFields: true,
        canManageBookings: true,
        canReadBookings: true,
        canManagePayments: true,
        canReadPayments: true,
        canManageSchedule: true,
        canManageCMS: true,
        canManageAdmins: false,
        canViewReports: false,
        canVerifyPayments: true,
        canCreateBookings: true,
        canManageSettings: false,
      };
    default:
      return {
        canManageFields: false,
        canReadFields: true,
        canManageBookings: false,
        canReadBookings: true,
        canManagePayments: false,
        canReadPayments: true,
        canManageSchedule: false,
        canManageCMS: false,
        canManageAdmins: false,
        canViewReports: false,
        canVerifyPayments: false,
        canCreateBookings: false,
        canManageSettings: false,
      };
  }
}

function mapRolePermissions(
  rolePermission: { [key: string]: unknown } | null,
  role: AdminRole,
): AdminPermissions {
  if (!rolePermission) {
    return getDefaultPermissions(role);
  }

  return {
    canManageFields: Boolean(rolePermission.canManageFields),
    canReadFields:
      rolePermission.canReadFields !== undefined
        ? Boolean(rolePermission.canReadFields)
        : Boolean(rolePermission.canManageFields),
    canManageBookings: Boolean(rolePermission.canManageBookings),
    canReadBookings: Boolean(rolePermission.canReadBookings),
    canManagePayments: Boolean(rolePermission.canManagePayments),
    canReadPayments:
      rolePermission.canReadPayments !== undefined
        ? Boolean(rolePermission.canReadPayments)
        : Boolean(rolePermission.canManagePayments),
    canManageSchedule: Boolean(rolePermission.canManageSchedule),
    canManageCMS: Boolean(rolePermission.canManageCMS),
    canManageAdmins: Boolean(rolePermission.canManageAdmins),
    canViewReports: Boolean(rolePermission.canViewReports),
    canVerifyPayments: Boolean(rolePermission.canVerifyPayments),
    canCreateBookings: Boolean(rolePermission.canCreateBookings),
    canManageSettings: Boolean(rolePermission.canManageSettings),
  };
}

export function getAdminPanelPath(role: string) {
  const normalizedRole = normalizeAdminRole(role);

  switch (normalizedRole) {
    case ADMIN_ROLES.superAdmin:
      return "/superadmin";
    case ADMIN_ROLES.manager:
      return "/manager";
    default:
      return "/staff";
  }
}

export function isAdminRoleAllowed(role: string, allowedRoles: AdminRole[]) {
  const normalizedRole = normalizeAdminRole(role);
  return allowedRoles.includes(normalizedRole);
}

export function hasAdminPermission(admin: AuthenticatedAdmin | null, permission: keyof AdminPermissions) {
  if (!admin) {
    return false;
  }

  return admin.permissions[permission] === true;
}

async function ensureDefaultRolePermissions() {
  const rolePermissions = [
    {
      role: ADMIN_ROLES.superAdmin,
      canManageFields: true,
      canManageBookings: true,
      canReadBookings: true,
      canManagePayments: true,
      canReadPayments: true,
      canManageSchedule: true,
      canManageCMS: true,
      canManageAdmins: true,
      canViewReports: true,
      canVerifyPayments: true,
      canCreateBookings: true,
      canManageSettings: true,
      isActive: true,
    },
    {
      role: ADMIN_ROLES.manager,
      canManageFields: true,
      canManageBookings: true,
      canReadBookings: true,
      canManagePayments: true,
      canReadPayments: true,
      canManageSchedule: true,
      canManageCMS: true,
      canManageAdmins: false,
      canViewReports: false,
      canVerifyPayments: true,
      canCreateBookings: true,
      canManageSettings: false,
      isActive: true,
    },
    {
      role: ADMIN_ROLES.staff,
      canManageFields: false,
      canManageBookings: false,
      canReadBookings: true,
      canManagePayments: false,
      canReadPayments: true,
      canManageSchedule: false,
      canManageCMS: false,
      canManageAdmins: false,
      canViewReports: false,
      canVerifyPayments: false,
      canCreateBookings: false,
      canManageSettings: false,
      isActive: true,
    },
  ];

  for (const rolePermission of rolePermissions) {
    await prisma.adminRolePermission.upsert({
      where: { role: rolePermission.role },
      update: rolePermission,
      create: rolePermission,
    });
  }
}

async function ensureSeededAdminUsers() {
  await ensureDefaultRolePermissions();

  for (const seededAdmin of SEEDED_ADMIN_CREDENTIALS) {
    const existing = await prisma.adminUser.findUnique({
      where: { email: seededAdmin.email.toLowerCase() },
    });

    if (!existing) {
      await prisma.adminUser.create({
        data: {
          name: seededAdmin.name,
          email: seededAdmin.email.toLowerCase(),
          passwordHash: hashSecret(seededAdmin.password),
          role: seededAdmin.role,
          isActive: true,
        },
      });
    }
  }
}

async function ensureDefaultAdminUser() {
  await ensureSeededAdminUsers();
  const passwordHash = hashSecret(DEFAULT_ADMIN_PASSWORD);
  const normalizedEmail = DEFAULT_ADMIN_EMAIL.toLowerCase();

  const existing = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminUser.create({
    data: {
      name: "System Administrator",
      email: normalizedEmail,
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

  const seededAccount = SEEDED_ADMIN_CREDENTIALS.find((account) => account.email.toLowerCase() === normalizedEmail);
  if (seededAccount) {
    await ensureSeededAdminUsers();
    return prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
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

function isMissingRolePermissionTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMetaCause = (error as { meta?: { cause?: unknown } }).meta?.cause;
  const maybeMessage = (error as { message?: unknown }).message;

  if (maybeCode !== "P2021") {
    return false;
  }

  if (typeof maybeMetaCause === "string" && maybeMetaCause.includes("admin_role_permission")) {
    return true;
  }

  if (typeof maybeMessage === "string" && maybeMessage.includes("admin_role_permission")) {
    return true;
  }

  return false;
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

  type SessionWithUserAndPermissions = Prisma.AdminSessionGetPayload<{
    include: { adminUser: { include: { rolePermission: true } } };
  }>;

  let session: SessionWithUserAndPermissions | null = null;
  try {
    session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { adminUser: { include: { rolePermission: true } } },
    });
  } catch (error) {
    if (isMissingRolePermissionTableError(error)) {
      console.warn("Missing admin_role_permission table; falling back to default admin permissions.");
      session = await prisma.adminSession.findUnique({
        where: { tokenHash },
        include: { adminUser: true },
      }) as SessionWithUserAndPermissions | null;
    } else {
      throw error;
    }
  }

  if (!session || !session.adminUser || session.expiresAt < new Date()) {
    return null;
  }

  const adminUser = session.adminUser as {
    id: string;
    name: string;
    email: string;
    role: string;
    rolePermission?: {
      canManageFields: boolean;
      canReadFields: boolean;
      canManageBookings: boolean;
      canManagePayments: boolean;
      canManageSchedule: boolean;
      canManageCMS: boolean;
      canManageAdmins: boolean;
      canViewReports: boolean;
      canVerifyPayments: boolean;
      canCreateBookings: boolean;
      canReadBookings: boolean;
      canManageSettings: boolean;
    } | null;
  };
  const role = normalizeAdminRole(adminUser.role);
  const permissions = mapRolePermissions(adminUser.rolePermission ?? null, role);

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role,
    permissions,
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
