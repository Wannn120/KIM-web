import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getDateRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function GET(request: Request, props: { params: Promise<{ fieldId: string }> }) {
  const params = await props.params;
  const fieldId = params.fieldId;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  try {
    if (!fieldId) {
      return NextResponse.json(
        { success: false, message: "Field ID is required." },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required." },
        { status: 400 }
      );
    }

    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true, price: true },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, message: "Field not found." },
        { status: 404 }
      );
    }

    const range = getDateRange(date);
    if (!range) {
      return NextResponse.json(
        { success: false, message: "Invalid date format." },
        { status: 400 }
      );
    }

    const schedules = await prisma.fieldSchedule.findMany({
      where: {
        fieldId,
        date: {
          gte: range.start,
          lt: range.end,
        },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        isAvailable: true,
      },
    });

    return NextResponse.json({
      success: true,
      field,
      schedules,
    });
  } catch (error) {
    console.error("Error fetching field schedule:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch field schedule." },
      { status: 500 }
    );
  }
}
