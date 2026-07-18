import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeObject } from "@/lib/security";
import { isValidEmail } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const safeBody = sanitizeObject(body as Record<string, unknown>);
    const name = typeof safeBody?.name === "string" ? safeBody.name.trim() : "";
    const email = typeof safeBody?.email === "string" ? safeBody.email.trim() : "";
    const phone = typeof safeBody?.phone === "string" ? safeBody.phone.trim() : "";

    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: auth.user.sub },
      data: {
        name,
        email,
        phone: phone || null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile update error:", error);

    const prismaError = error && typeof error === "object" && "code" in error ? error : null;
    if (prismaError && (prismaError as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, message: "Email is already in use." }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: "Unable to update profile." }, { status: 500 });
  }
}
