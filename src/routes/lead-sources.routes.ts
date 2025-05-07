import express from "express";
import {
  createLeadSourceController,
  getAllLeadSourceController,
  getLeadSourceByIdController,
  softDeleteLeadSourceController,
  updateLeadSourceController,
} from "../controllers/lead-sources.controller";

// Initialize Express router
const router = express.Router();

// Route to create a new lead source
// POST /lead-sources/
router.post("/", createLeadSourceController);

// Route to get a lead source by its ID
// GET /lead-sources/:id
router.get("/:id", getLeadSourceByIdController);

// Route to get all lead sources
// GET /lead-sources/
router.get("/", getAllLeadSourceController);

// Route to update a lead source by ID
// PUT /lead-sources/:id
router.put("/:id", updateLeadSourceController);

// Route to soft delete a lead source by ID
// DELETE /lead-sources/:id
router.delete("/:id", softDeleteLeadSourceController);

// Export the router to be used in the main app
export default router;
