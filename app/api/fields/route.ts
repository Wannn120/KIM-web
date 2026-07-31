import { NextResponse } from "next/server";
import { DEFAULT_FIELD } from "@/lib/venue";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [DEFAULT_FIELD],
  });
}
