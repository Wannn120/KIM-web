import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        field: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: reviews.map((review) => ({
        id: review.id,
        customerName: review.customerName,
        fieldName: review.field?.name ?? null,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, message: "Unable to fetch reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
    const fieldId = typeof body?.fieldId === "string" ? body.fieldId : undefined;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : undefined;
    const rating = Number(body?.rating ?? 5);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

    if (!customerName || !comment) {
      return NextResponse.json(
        { success: false, message: "Customer name and comment are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    if (fieldId) {
      const field = await prisma.field.findUnique({
        where: { id: fieldId },
        select: { id: true },
      });

      if (!field) {
        return NextResponse.json(
          { success: false, message: "Field not found." },
          { status: 404 }
        );
      }
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found." },
          { status: 404 }
        );
      }
    }

    const review = await prisma.review.create({
      data: {
        customerName,
        fieldId,
        bookingId,
        rating: Math.round(rating),
        comment,
      },
      include: {
        field: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review created successfully.",
      review: {
        id: review.id,
        customerName: review.customerName,
        fieldName: review.field?.name ?? null,
        rating: review.rating,
        comment: review.comment,
        date: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create review." },
      { status: 500 }
    );
  }
}
