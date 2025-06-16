import { Router } from "express";
import { milestoneController } from "../controllers/project-milestone.controller";

const router = Router();
const controller = milestoneController();

router.post("/", controller.createMilestone);
router.get("/", controller.getAllMilestones);
router.get("/:id", controller.getMilestoneById);
router.put("/:id", controller.updateMilestone);
router.delete("/:id", controller.deleteMilestone);

export default router;
