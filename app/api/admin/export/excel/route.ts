import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "date,field,bookings,revenue",
    "2026-07-07,Elite Turf 1,24,1800000",
    "2026-07-06,Club Arena,18,1500000",
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=admin-report.csv",
    },
  });
}
