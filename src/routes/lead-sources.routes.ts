import express from "express";
import { leadSourceController } from "../controllers/lead-sources.controller";

const router = express.Router();

// Call the controller function to get the methods
const controller = leadSourceController();

router.post("/", controller.createLeadSource);
router.get("/", controller.getAllLeadSources);
router.get("/:id", controller.getLeadSourceById);
router.put("/:id", controller.updateLeadSource);
router.delete("/:id", controller.softDeleteLeadSource);

export default router;

