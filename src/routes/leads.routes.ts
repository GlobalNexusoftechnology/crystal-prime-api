import express from "express";
import {
  createLeadController,
  getAllLeadsController,
  getLeadByIdController,
  updateLeadController,
  softDeleteLeadController,
} from "../controllers/leads.controller";

// Initialize Express router
const router = express.Router();

// Route to create a new lead
// POST /leads/
router.post("/", createLeadController);

// Route to get a lead by its ID
// GET /leads/:id
router.get("/:id", getLeadByIdController);

// Route to get all leads
// GET /leads/
router.get("/", getAllLeadsController);

// Route to update a lead by ID
// PUT /leads/:id
router.put("/:id", updateLeadController);

// Route to soft delete a lead by ID
// DELETE /leads/:id
router.delete("/:id", softDeleteLeadController);

// Export the router to be used in the main app
export default router;
