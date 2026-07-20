import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query : "";

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 }
      );
    }

    // Only allow SELECT queries for safety
    const upperQuery = query.toUpperCase().trim();
    if (!upperQuery.startsWith("SELECT")) {
      return NextResponse.json(
        { success: false, message: "Only SELECT queries are allowed" },
        { status: 400 }
      );
    }

    // Execute the query using raw SQL
    const results = await prisma.$queryRawUnsafe(query);

    return NextResponse.json({
      success: true,
      results: Array.isArray(results) ? results : [],
    });
  } catch (error) {
    console.error("Query execution error:", error);
    const message = (error as Error).message || "Query execution failed";
    
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
