import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(
    reviews.map((review) => ({
      id: review.id,
      customerName: review.customerName,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
    })),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const customerName = normalizeText(body?.customerName);
    const comment = normalizeText(body?.comment);
    const rating = Number(body?.rating ?? 5);

    if (!customerName || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const created = await prisma.review.create({
      data: {
        customerName,
        rating: Math.round(rating),
        comment,
        date,
      },
    });

    return NextResponse.json({
      id: created.id,
      customerName: created.customerName,
      rating: created.rating,
      comment: created.comment,
      date: created.date,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
