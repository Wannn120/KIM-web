import { NextRequest, NextResponse } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

function getEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://snap-assets.sandbox.midtrans.com https://snap-assets.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://pay.google.com https://gwk.gopayapi.com/sdk/stable/gp-container.min.js https://www.googletagmanager.com https://o.alicdn.com https://g.alicdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://res.cloudinary.com https://snap-assets.sandboxmidtrans.com https://snap-assets.sandbox.midtrans.com https://snap-assets.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://pay.google.com https://g.alicdn.com",
    "connect-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://api.sandbox.midtrans.com https://api.midtrans.com https://snap-assets.sandbox.midtrans.com",
    "frame-src https://app.sandbox.midtrans.com https://app.midtrans.com",
    "child-src https://app.sandbox.midtrans.com https://app.midtrans.com",
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

interface CookieOptions {
  maxAge?: number;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
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
