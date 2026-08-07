import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_IS_PRODUCTION = String(process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";
const MIDTRANS_SANDBOX_URL = process.env.MIDTRANS_SANDBOX_URL ?? "https://app.sandbox.midtrans.com";
const MIDTRANS_PRODUCTION_URL = process.env.MIDTRANS_PRODUCTION_URL ?? "https://app.midtrans.com";
const MIDTRANS_BASE_URL = process.env.MIDTRANS_BASE_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/snap/v1/transactions`;
const MIDTRANS_STATUS_BASE_URL = process.env.MIDTRANS_STATUS_BASE_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/v2`;
const MIDTRANS_SNAP_SCRIPT_URL = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/snap/snap.js`;

export interface MidtransCreatePayload {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  notification_url?: string;
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  expiry?: {
    unit?: string;
    duration?: number;
  };
}

export interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

export async function createMidtransTransaction(payload: MidtransCreatePayload): Promise<MidtransTransactionResponse> {
  if (!MIDTRANS_SERVER_KEY.trim()) {
    const token = `mock-${Math.random().toString(36).slice(2, 12)}`;
    const redirectUrl = `${MIDTRANS_SANDBOX_URL}/snap/pay/${payload.transaction_details.order_id}`;

    return {
      token,
      redirect_url: redirectUrl,
    };
  }

  const grossAmount = Number(payload.transaction_details.gross_amount);
  const itemTotal = (payload.item_details ?? []).reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error("Invalid Midtrans payload: transaction_details.gross_amount must be a positive number.");
  }

  if (payload.item_details?.length && grossAmount !== itemTotal) {
    throw new Error(`Invalid Midtrans payload: gross_amount ${grossAmount} does not match item_details total ${itemTotal}.`);
  }

  const response = await fetch(MIDTRANS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsedBody = null;
    }

    const errorMessages = parsedBody && Array.isArray(parsedBody.error_messages)
      ? parsedBody.error_messages.join(", ")
      : undefined;
    const message = errorMessages || parsedBody?.message || rawBody || `Midtrans request failed with status ${response.status}`;
    throw new Error(`Midtrans request failed (${response.status}): ${message}`);
  }

  try {
    return JSON.parse(rawBody) as MidtransTransactionResponse;
  } catch {
    throw new Error("Midtrans returned an invalid response body.");
  }
}

export async function getMidtransTransactionStatus(orderId: string): Promise<Record<string, unknown>> {
  if (!MIDTRANS_SERVER_KEY.trim()) {
    throw new Error("Midtrans server key is required to fetch transaction status.");
  }

  const url = `${MIDTRANS_STATUS_BASE_URL}/${encodeURIComponent(orderId)}/status`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
      "Accept": "application/json",
    },
  });

  const rawBody = await response.text();
  if (!response.ok) {
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsedBody = null;
    }

    const errorMessage = parsedBody?.message ?? rawBody ?? `Midtrans status lookup failed with ${response.status}`;
    throw new Error(`Midtrans status fetch failed (${response.status}): ${errorMessage}`);
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid Midtrans status response body.");
  }
}

export function resolveMidtransTransactionStatus(body: Record<string, unknown>): string {
  if (typeof body?.transaction_status === "string") return body.transaction_status;
  if (typeof body?.status === "string") return body.status;
  if (typeof body?.transactionStatus === "string") return body.transactionStatus;
  if (typeof body?.status_code === "string") return body.status_code;
  return "";
}

function parseMidtransBody(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function verifyMidtransSignature(rawBody: string, signature: string) {
  if (!MIDTRANS_SERVER_KEY || !signature.trim()) {
    return false;
  }

  const normalizedSignature = signature.trim().toLowerCase();
  const expectedFromRawBody = crypto
    .createHash("sha512")
    .update(`${rawBody}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedFromRawBody, "hex");
  const providedBuffer = Buffer.from(normalizedSignature, "hex");

  if (expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return true;
  }

  const parsedBody = parseMidtransBody(rawBody);
  if (!parsedBody) {
    return false;
  }

  const orderId = typeof parsedBody.order_id === "string" ? parsedBody.order_id : typeof parsedBody.orderId === "string" ? parsedBody.orderId : "";
  const statusCode = typeof parsedBody.status_code === "string" ? parsedBody.status_code : typeof parsedBody.statusCode === "string" ? parsedBody.statusCode : "";
  const grossAmount = typeof parsedBody.gross_amount === "string" ? parsedBody.gross_amount : typeof parsedBody.grossAmount === "string" ? parsedBody.grossAmount : "";

  if (!orderId || !statusCode || !grossAmount) {
    return false;
  }

  const expectedFromFields = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");

  const expectedFieldBuffer = Buffer.from(expectedFromFields, "hex");
  if (expectedFieldBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedFieldBuffer, providedBuffer);
}

export function getMidtransConfig() {
  return {
    clientKey: MIDTRANS_CLIENT_KEY,
    serverKey: MIDTRANS_SERVER_KEY,
    baseUrl: MIDTRANS_BASE_URL,
    snapScriptUrl: MIDTRANS_SNAP_SCRIPT_URL,
  };
}
