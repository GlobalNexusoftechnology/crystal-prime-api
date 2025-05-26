import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

export const excelUpload = multer({
  storage: multer.memoryStorage(), // Use in-memory buffer for file uploads
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    // Allow only Excel MIME types
    const isExcel = file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (isExcel) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: 5MB file size limit
});
