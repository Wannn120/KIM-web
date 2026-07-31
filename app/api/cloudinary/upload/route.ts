import { NextResponse } from "next/server";
import { uploadImageFromUrl } from "@/lib/cloudinary";
import { getAuthenticatedAdminFromToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
    const admin = await getAuthenticatedAdminFromToken(match ? decodeURIComponent(match[1]) : "");
    if (!admin) return NextResponse.json({ success: false, message: "Admin authentication required." }, { status: 401 });
    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: "imageUrl is required." }, { status: 400 });
    }

    const result = await uploadImageFromUrl(imageUrl);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload image." }, { status: 500 });
  }
}
