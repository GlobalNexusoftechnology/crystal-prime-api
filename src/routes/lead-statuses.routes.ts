import express from "express";
import {
  createLeadStatusController,
  getAllLeadStatusController,
  getLeadStatusByIdController,
  softDeleteLeadStatusController,
  updateLeadStatusController,
} from "../controllers/lead-statuses.controller";

// Initialize Express router
const router = express.Router();

// Route to create a new lead status
// POST /lead-statuses/
router.post("/", createLeadStatusController);

// Route to get a lead status by its ID
// GET /lead-statuses/:id
router.get("/:id", getLeadStatusByIdController);

// Route to get all lead statuses
// GET /lead-statuses/
router.get("/", getAllLeadStatusController);

// Route to update a lead status by ID
// PUT /lead-statuses/:id
router.put("/:id", updateLeadStatusController);

// Route to soft delete a lead status by ID
// DELETE /lead-statuses/:id
router.delete("/:id", softDeleteLeadStatusController);

// Export the router to be used in the main app
export default router;
