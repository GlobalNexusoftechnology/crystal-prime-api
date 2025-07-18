import express from "express";

import { ProjectAttachmentController } from "../controllers/project-attachments.controller";
import { deserializeUser, requireUser, singleDocumentUpload, upload } from "../middleware";

const router = express.Router();

router.use(deserializeUser, requireUser);

// Call the controller function to get the methods
const controller = ProjectAttachmentController();

router.post(
  "/uploadAttachment",
  singleDocumentUpload, controller.uploadSingleFileToCloudinary
);

router.post(
  "/uploadMultipleAttachments",
  upload,
  controller.uploadMultipleFilesToCloudinary
);

router.post("/", controller.createAttachment);
router.get("/", controller.getAllAttachments);
router.get("/:id", controller.getAttachmentById);
router.put("/:id", controller.updateAttachment);
router.delete("/:id", controller.deleteAttachment);

export default router;