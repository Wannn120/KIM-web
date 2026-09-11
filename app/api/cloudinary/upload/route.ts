import { NextResponse } from "next/server";
import { uploadImageFromUrl } from "@/lib/cloudinary";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";

const ALLOWED_PROTOCOLS = ["https:"];
const BLOCKED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "169.254.169.254", "metadata.google.internal", "100.100.100.200"];

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return false;
    if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
    if (parsed.hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
    if (!admin) return NextResponse.json({ success: false, message: "Admin authentication required." }, { status: 401 });
    if (!hasAdminPermission(admin, "canManageCMS") && !hasAdminPermission(admin, "canManageGallery") && !hasAdminPermission(admin, "canManageFeatures")) {
      return NextResponse.json({ success: false, message: "Insufficient privileges." }, { status: 403 });
    }
    const body = await request.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: "imageUrl is required." }, { status: 400 });
    }
    if (!isSafeUrl(imageUrl)) {
      return NextResponse.json({ success: false, message: "Invalid or unsafe image URL. Only public HTTPS URLs are allowed." }, { status: 400 });
    }

    const result = await uploadImageFromUrl(imageUrl);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload image." }, { status: 500 });
  }
}
