import express from "express";
import { leadFollowupController } from "../controllers/lead-followups.controller";

const router = express.Router();
const controller = leadFollowupController();

router.post("/", controller.createLeadFollowup); // Create a lead followup
router.get("/", controller.getAllLeadFollowups); // Get all lead followups
router.get("/:id", controller.getLeadFollowupById); // Get lead followup by ID
router.put("/:id", controller.updateLeadFollowup); // Update lead followup by ID
router.delete("/:id", controller.softDeleteLeadFollowup); // Soft delete lead followup by ID

export default router;

