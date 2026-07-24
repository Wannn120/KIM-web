import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_ROLES, getAuthenticatedAdmin, isAdminRoleAllowed } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Admin session not found." }, { status: 401 });
    }

    if (!isAdminRoleAllowed(admin.role, [ADMIN_ROLES.superAdmin])) {
      return NextResponse.json({ success: false, message: "Only super admins can run SQL queries." }, { status: 403 });
    }

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
