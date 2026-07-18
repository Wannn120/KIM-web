import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const fields = await prisma.field.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        location: true,
        description: true,
        price: true,
        type: true,
        size: true,
        capacity: true,
        rating: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: fields,
    });
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch fields." },
      { status: 500 }
    );
  }
}
