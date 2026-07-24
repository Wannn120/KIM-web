import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_BASE_URL = process.env.MIDTRANS_BASE_URL ?? "https://app.sandbox.midtrans.com/snap/v1/transactions";
const MIDTRANS_SNAP_SCRIPT_URL = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? "https://app.sandbox.midtrans.com/snap/snap.js";

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
    throw new Error("MIDTRANS_SERVER_KEY is not configured.");
  }

  const response = await fetch(MIDTRANS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Midtrans request failed: ${message}`);
  }

  return response.json();
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
