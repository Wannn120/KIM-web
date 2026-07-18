import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
}

function getEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

function toBase64Url(value: Buffer) {
  return value.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64");
}

function getSecret() {
  return getEnv("JWT_SECRET", "local-dev-secret-change-me");
}

export function getRateLimitResult(identifier: string, limit = Number(getEnv("RATE_LIMIT_MAX", "60")), windowMs = Number(getEnv("RATE_LIMIT_WINDOW_MS", "60000"))): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || existing.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    rateLimitStore.set(identifier, next);
    return { allowed: true, remaining: limit - 1, resetAt: next.resetAt, limit };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt, limit };
}

export function applySecurityHeaders(response: NextResponse, request?: NextRequest) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "no-referrer");
  response.headers.set("permissions-policy", "geolocation=(), microphone=(), camera=(), payment=()");
  response.headers.set("x-xss-protection", "1; mode=block");

  if (request?.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production") {
    response.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }

  return response;
}

export function createJwt(payload: Record<string, unknown>, secret = getSecret()) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 8,
  };

  const encodedHeader = toBase64Url(Buffer.from(JSON.stringify(header)));
  const encodedBody = toBase64Url(Buffer.from(JSON.stringify(body)));
  const signingInput = `${encodedHeader}.${encodedBody}`;
  const signature = createHmac("sha256", secret).update(signingInput).digest();
  return `${signingInput}.${toBase64Url(signature)}`;
}

export function verifyJwt(token: string, secret = getSecret()) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSignatureBuffer = createHmac("sha256", secret).update(signingInput).digest();
  const providedSignatureBuffer = fromBase64Url(signatureSegment);
  if (!providedSignatureBuffer || providedSignatureBuffer.length === 0) {
    return null;
  }

  if (expectedSignatureBuffer.length !== providedSignatureBuffer.length) {
    return null;
  }

  const isValid = timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer);
  if (!isValid) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(fromBase64Url(payloadSegment)).toString("utf8"));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function createCsrfToken(secret = getSecret()) {
  const randomValue = randomBytes(24).toString("hex");
  const signature = createHmac("sha256", secret).update(randomValue).digest("hex");
  return `${randomValue}.${signature}`;
}

export function verifyCsrfToken(token: string, secret = getSecret()) {
  if (!token) {
    return false;
  }

  const [value, signature] = token.split(".");
  if (!value || !signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(value).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function sanitizeString(value: string) {
  return value
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(value: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") {
      result[key] = sanitizeString(item);
    } else if (Array.isArray(item)) {
      result[key] = item.map((entry) => (typeof entry === "string" ? sanitizeString(entry) : entry));
    } else if (item && typeof item === "object") {
      result[key] = sanitizeObject(item as Record<string, unknown>);
    } else {
      result[key] = item;
    }
  }
  return result as T;
}

export function setSecureCookie(response: NextResponse, name: string, value: string, options: CookieOptions = {}) {
  const secure = options.secure ?? ((process.env.COOKIE_SECURE === "true") || (process.env.NODE_ENV === "production"));
  response.cookies.set(name, value, {
    path: options.path ?? "/",
    httpOnly: options.httpOnly ?? true,
    secure,
    sameSite: options.sameSite ?? "lax",
    maxAge: options.maxAge ?? 60 * 60 * 8,
  });
}

export function clearSecureCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}
