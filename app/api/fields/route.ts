import { NextResponse } from "next/server";
import { DEFAULT_FIELD } from "@/lib/venue";
import { getFieldHourlyRate } from "@/lib/site-content";

export async function GET() {
  const hourlyRate = await getFieldHourlyRate();
  return NextResponse.json({
    success: true,
    data: [{ ...DEFAULT_FIELD, price: hourlyRate }],
  });
}
