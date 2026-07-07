import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_BASE_URL = process.env.MIDTRANS_BASE_URL ?? "https://app.sandbox.midtrans.com/snap/v1/transactions";

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
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

export interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

export async function createMidtransTransaction(payload: MidtransCreatePayload): Promise<MidtransTransactionResponse> {
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

export function verifyMidtransSignature(rawBody: string, signature: string) {
  if (!MIDTRANS_SERVER_KEY) {
    return false;
  }

  const expected = crypto
    .createHash("sha512")
    .update(`${rawBody}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function getMidtransConfig() {
  return {
    clientKey: MIDTRANS_CLIENT_KEY,
    serverKey: MIDTRANS_SERVER_KEY,
    baseUrl: MIDTRANS_BASE_URL,
  };
}
