import { NextResponse } from "next/server";
import { uploadImageFromBuffer } from "@/lib/cloudinary";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
    if (!admin) return NextResponse.json({ success: false, message: "Admin authentication required." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageCMS") && !hasAdminPermission(admin, "canManageGallery") && !hasAdminPermission(admin, "canManageFeatures")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "File is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "File too large. Maximum 10 MB." }, { status: 400 });
    }

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ success: false, message: "Invalid file type. Only JPEG, PNG, WebP, GIF, BMP allowed." }, { status: 400 });
    }

    const result = await uploadImageFromBuffer(buffer, mimeType);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload file." }, { status: 500 });
  }
}
