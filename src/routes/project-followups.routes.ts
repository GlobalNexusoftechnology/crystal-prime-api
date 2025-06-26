import { Router } from "express";
import { projectFollowupController } from "../controllers/project-followups.controller";

const router = Router();
const controller = projectFollowupController();

router.post("/", controller.createFollowup);
router.get("/", controller.getAllFollowups);
router.get("/:id", controller.getFollowupById);
router.patch("/:id", controller.updateFollowup);
router.delete("/:id", controller.softDeleteFollowup);

export default router; 