import express from "express";
import {
  createLeadSourceController,
  getAllLeadSourceController,
  getLeadSourceByIdController,
  softDeleteLeadSourceController,
  updateLeadSourceController,
} from "../controllers/lead-sources.controller";

const router = express.Router();

router.post("/", createLeadSourceController);
router.get("/:id", getLeadSourceByIdController);
router.get("/", getAllLeadSourceController);
router.put("/:id", updateLeadSourceController);
router.delete("/:id", softDeleteLeadSourceController);

export default router;
