import { NextResponse } from "next/server";
import { getAuthenticatedAdminFromToken, hasAdminPermission } from "@/lib/admin-auth";
import { getSiteContent, saveSiteContent } from "@/lib/site-content";

function tokenFrom(request: Request) {
  const match = (request.headers.get("cookie") ?? "").match(/admin-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function authorize(request: Request) {
  const admin = await getAuthenticatedAdminFromToken(tokenFrom(request));
  return admin && hasAdminPermission(admin, "canManageSettings") ? admin : null;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ success: false, message: "Settings access required." }, { status: 403 });
  return NextResponse.json({ success: true, data: await getSiteContent() });
}

export async function PUT(request: Request) {
  if (!(await authorize(request))) return NextResponse.json({ success: false, message: "Settings access required." }, { status: 403 });
  try {
    const body = await request.json();
    const data = await saveSiteContent(body);
    return NextResponse.json({ success: true, data, message: "Website content saved." });
  } catch (error) {
    console.error("[ADMIN] Save site content error:", error);
    return NextResponse.json({ success: false, message: "Unable to save website content." }, { status: 500 });
  }
}
