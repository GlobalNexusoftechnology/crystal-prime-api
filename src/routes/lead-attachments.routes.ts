import express from "express";
import { leadAttachmentController } from "../controllers/lead-attachments.controller";

const router = express.Router();

// Call the controller function to get the methods
const controller = leadAttachmentController();

router.post("/", controller.createAttachment);
router.get("/", controller.getAllAttachments);
router.get("/:id", controller.getAttachmentById);
router.put("/:id", controller.updateAttachment);
router.delete("/:id", controller.softDeleteAttachment);

export default router;


