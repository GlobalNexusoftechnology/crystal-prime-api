import multer from "multer";

/**
 * Configures multer for multiple file uploads (up to 10 images).
 * - Uses memory storage.
 * - Limits file size to 10MB per file.
 * - Accepts up to 10 images under the field name "image".
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).array("image", 10);

/**
 * Configures multer for single file upload.
 * - Uses memory storage.
 * - Limits file size to 10MB.
 * - Accepts one image under the field name "image".
 */
const singleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single("image");


const singleDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single("document");

export { upload, singleUpload,singleDocumentUpload };
