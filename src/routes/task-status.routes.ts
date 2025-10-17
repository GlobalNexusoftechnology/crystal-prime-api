import { Router } from "express";
import { TaskStatusController } from "../controllers/task-status.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();
const controller = TaskStatusController();

router.use(deserializeUser, requireUser);
// Task status change routes
router.put("/tasks/:taskId/status", controller.updateTaskStatus);

// Project status routes
router.get("/projects/:projectId/status", controller.getProjectStatusDetails);
router.put("/projects/:projectId/status", controller.updateProjectStatus);

// Milestone status routes (for testing/debugging)
router.put("/milestones/:milestoneId/status", controller.updateMilestoneStatus);

export default router; 