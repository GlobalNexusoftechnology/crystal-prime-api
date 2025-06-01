import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import path from "path";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Convert buffer to readable stream
const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

// Remove file extension
const cleanFileName = (fileName: string): string => {
  return path.basename(fileName, path.extname(fileName));
};

// Decide Cloudinary resource type based on file extension
const getResourceType = (fileName: string): "image" | "raw" | "auto" => {
  const ext = path.extname(fileName).toLowerCase();
  const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
  const documentTypes = [".pdf", ".xls", ".xlsx", ".csv"];

  if (imageTypes.includes(ext)) return "image";
  if (documentTypes.includes(ext)) return "raw";
  return "auto";
};

// Upload to Cloudinary
export const uploadToCloudinary = async (
  file: Buffer,
  fileName: string,
  folder: string = "uploads"
): Promise<{ url: string; public_id: string }> => {
  try {
    const cleanedFileName = cleanFileName(fileName);
    const ext = path.extname(fileName).toLowerCase();
    const resourceType = getResourceType(fileName);
    // const publicId = `${folder}/${cleanedFileName}`;

     // ✅ Add extension only for raw files
    const publicId =
      resourceType === "raw"
        ? `${folder}/${cleanedFileName}${ext}`
        : `${folder}/${cleanedFileName}`;
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Upload failed."));
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );

      bufferToStream(file).pipe(uploadStream);
    });
  } catch (err) {
    throw new Error(`Cloudinary upload failed: ${(err as Error).message}`);
  }
};