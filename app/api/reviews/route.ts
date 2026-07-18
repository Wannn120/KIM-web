import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        field: {
          select: {
            id: true,
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
        customerName: review.user.name,
        userName: review.user.name,
        fieldName: review.field.name,
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
    const auth = requireAuth(request);
    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const fieldId = typeof body?.fieldId === "string" ? body.fieldId : "";
    const rating = Number(body?.rating ?? 5);
    const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

    if (!fieldId || !comment) {
      return NextResponse.json(
        { success: false, message: "Field ID and comment are required." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    // Check if field exists
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
      select: { id: true, name: true },
    });

    if (!field) {
      return NextResponse.json(
        { success: false, message: "Field not found." },
        { status: 404 }
      );
    }

    // Check if user already reviewed this field
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: auth.user.sub,
        fieldId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "You have already reviewed this field." },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: auth.user.sub,
        fieldId,
        rating: Math.round(rating),
        comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        field: {
          select: {
            id: true,
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
        customerName: review.user.name,
        userName: review.user.name,
        fieldName: review.field.name,
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
