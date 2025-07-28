import crypto from "crypto";
import { Request } from "express";
import AppError from "./appError";

export function verifyMetaSignature(req: Request): void {
  const APP_SECRET = process.env.META_APP_SECRET;

  if (!APP_SECRET) {
    throw new Error("META_APP_SECRET is not defined in environment variables");
  }

  const signature = req.headers["x-hub-signature"] as string;
  const body = JSON.stringify(req.body);

  if (!signature || !body) {
    throw new AppError(400, "Missing signature or body in request");
  }

  const [method, receivedHash] = signature.split("=");

  const expectedHash = crypto
    .createHmac("sha1", APP_SECRET)
    .update(body)
    .digest("hex");

  if (receivedHash !== expectedHash) {
    throw new AppError(403, "Invalid X-Hub-Signature");
  }
}
