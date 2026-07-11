import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, rating, comment } = body;

    if (!customerName || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const created = await prisma.review.create({
      data: {
        customerName: String(customerName),
        rating: Number(rating ?? 5),
        comment: String(comment),
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
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
