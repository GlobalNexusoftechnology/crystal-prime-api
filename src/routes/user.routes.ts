import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import {
  createUserController,
  getAllUsersHandler,
  getProfileController,
  softDeleteUserHandler,
  updateProfileController,
  exportUsersExcelController,
  changePasswordController,
  createClientCredentialsHandler,
} from "../controllers";
import { validate } from "../middleware";
import { createClientCredentialsSchema } from "../schemas";

const router = express.Router();

// Ensure user is authenticated
router.use(deserializeUser, requireUser);

router.get("/export", exportUsersExcelController);
router.post("/", createUserController);
router.get("/:id", getProfileController);
router.get("/", getAllUsersHandler);
router.delete("/:id", softDeleteUserHandler);
router.put("/:id", updateProfileController);
router.post("/change-password", changePasswordController);
router.post(
  "/client/credentials",
  validate(createClientCredentialsSchema),
  createClientCredentialsHandler
);

export default router;
