import express from "express";
import { leadStatusHistoryController } from "../controllers/lead-status-history.controller";

const router = express.Router();

// Initialize the controller methods
const controller = leadStatusHistoryController();

router.post("/", controller.createLeadStatusHistory);
router.get("/", controller.getAllLeadStatusHistories);
router.get("/:id", controller.getLeadStatusHistoryById);
router.put("/:id", controller.updateLeadStatusHistory);
router.delete("/:id", controller.softDeleteLeadStatusHistory);

export default router;
