export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export function validateBookingPayload(body: Record<string, unknown>) {
  const fieldId = typeof body.fieldId === "string" ? body.fieldId : "";
  const startAt = typeof body.startAt === "string" ? body.startAt : "";
  const endAt = typeof body.endAt === "string" ? body.endAt : "";

  if (!fieldId || !startAt || !endAt) {
    return { ok: false, message: "fieldId, startAt, and endAt are required." } as const;
  }

  return { ok: true, fieldId, startAt, endAt } as const;
}
