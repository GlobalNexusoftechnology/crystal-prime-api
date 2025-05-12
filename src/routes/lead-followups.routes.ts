import express from "express";
import {
    createFollowupController,
    getAllFollowupsController,
    getFollowupByIdController,
    updateFollowupController,
    softDeleteFollowupController
} from "../controllers/lead-followups.controller";

// Initialize Express router
const router = express.Router();

// Route to create a new lead followup
// POST /lead-followups/
router.post("/", createFollowupController); // includes validation

// Route to get a lead followup by its ID
// GET /lead-followups/:id
router.get("/:id", getFollowupByIdController);

// Route to get all lead followups
// GET /lead-followups/
router.get("/", getAllFollowupsController);

// Route to update a lead followup by ID
// PUT /lead-followups/:id
router.put("/:id", updateFollowupController); // includes validation

// Route to soft delete a lead followup by ID
// DELETE /lead-followups/:id
router.delete("/:id", softDeleteFollowupController);

// Export the router to be used in the main app
export default router;
