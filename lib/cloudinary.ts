import { v2 as cloudinary } from "cloudinary";

function parseCloudinaryUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "cloudinary:") {
      throw new Error("Invalid Cloudinary URL protocol");
    }

    const [api_key, api_secret] = parsed.username ? [parsed.username, parsed.password] : ["", ""];
    const cloud_name = parsed.hostname;

    if (!cloud_name || !api_key || !api_secret) {
      throw new Error("Incomplete Cloudinary URL");
    }

    return { cloud_name, api_key, api_secret };
  } catch (error) {
    return null;
  }
}

const cloudinaryConfig = parseCloudinaryUrl(process.env.CLOUDINARY_URL ?? "") ?? {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

cloudinary.config({
  secure: true,
  ...cloudinaryConfig,
});

export async function uploadImageFromUrl(imageUrl: string, publicId?: string) {
  return cloudinary.uploader.upload(imageUrl, {
    public_id: publicId,
    overwrite: false,
    resource_type: "image",
  });
}

export async function uploadImageFromBuffer(buffer: Buffer, contentType: string, publicId?: string) {
  const dataUri = `data:${contentType};base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: false,
    resource_type: "image",
  });
}

export async function generateSignedUploadUrl() {
  const apiSecret = cloudinaryConfig.api_secret ?? process.env.CLOUDINARY_API_SECRET ?? "";
  return cloudinary.utils.api_sign_request(
    {
      timestamp: Math.round(Date.now() / 1000),
      eager: "c_scale,w_800",
    },
    apiSecret
  );
}
