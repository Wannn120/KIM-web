import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const schedules = await prisma.fieldSchedule.findMany({
      where: {
        fieldId,
        date: new Date(date),
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
