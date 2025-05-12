import express from "express";
import { leadStatusController } from "../controllers/lead-statuses.controller";

const router = express.Router();
const controller = leadStatusController();

router.post("/", controller.createLeadStatus);
router.get("/", controller.getAllLeadStatuses);
router.get("/:id", controller.getLeadStatusById);
router.put("/:id", controller.updateLeadStatus);
router.delete("/:id", controller.softDeleteLeadStatus);

export default router;

