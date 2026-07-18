import { NextResponse } from "next/server";
import { uploadImageFromBuffer } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "File is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadImageFromBuffer(buffer, file.type || "image/jpeg");

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to upload file." }, { status: 500 });
  }
}
