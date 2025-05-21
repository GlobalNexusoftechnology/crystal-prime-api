import express from "express";
import { leadController } from "../controllers/leads.controller";

const router = express.Router();
const controller = leadController();

router.post("/", controller.createLead);
router.get("/", controller.getAllLeads);
router.get("/:id", controller.getLeadById);
router.put("/:id", controller.updateLead);
router.delete("/:id", controller.softDeleteLead);
router.get("/export/excel", controller.exportLeadsExcelController);

export default router;

