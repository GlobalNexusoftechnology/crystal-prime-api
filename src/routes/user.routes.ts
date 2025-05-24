import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { createUserController, getAllUsersHandler, getProfileController, softDeleteUserHandler, updateProfileController, exportUsersExcelController } from "../controllers";

const router = express.Router();

// Ensure user is authenticated
// router.use(deserializeUser, requireUser);

router.get("/export", exportUsersExcelController);
router.post("/", createUserController)
router.get("/:id", getProfileController);
router.get("/", getAllUsersHandler);
router.delete("/:id", softDeleteUserHandler);
router.put("/:id", updateProfileController);

export default router;
