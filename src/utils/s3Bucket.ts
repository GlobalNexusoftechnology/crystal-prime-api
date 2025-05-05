import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const bucket = process.env.AWS_BUCKET_NAME as string;

export const uploadToS3 = async (file: Buffer, fileName: string): Promise<{ url: string; key: string; bucket: string }> => {
  try {
    const key = `${uuidv4()}-${fileName}`;
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    let contentType = "application/octet-stream";
    if (fileExtension === "pdf") {
      contentType = "application/pdf";
    } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension || "")) {
      contentType = `image/${fileExtension}`;
    }

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(params));

    return {
      url: `https://${bucket}.s3.amazonaws.com/${key}`,
      key,
      bucket,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
};
