import { NextResponse } from "next/server";
import { uploadImageFromUrl } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
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
