import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { singleUpload } from "../middleware";
import { getProfileController, updateProfileController } from "../controllers";

const router = express.Router();

// Ensure user is authenticated
router.use(deserializeUser, requireUser);

// Get user profile details
router.get("/getProfile", getProfileController);

// Update user profile by ID
router.put("/:id", singleUpload, updateProfileController);

export default router;
