import express from "express";
import { deserializeUser } from "../middleware/deserializeUser";
import { requireUser } from "../middleware/requireUser";
import { singleUpload } from "../middleware";
import { getAllUsersHandler, getProfileController, softDeleteUserHandler, updateProfileController } from "../controllers";

const router = express.Router();

// Ensure user is authenticated
router.use(deserializeUser, requireUser);


router.get("/getProfile", getProfileController);

router.get("/", getAllUsersHandler);

router.delete("/:id", softDeleteUserHandler);


router.put("/:id", singleUpload, updateProfileController);

export default router;
