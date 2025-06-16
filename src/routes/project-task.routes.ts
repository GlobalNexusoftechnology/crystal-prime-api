import { Router } from "express";
import { projectTaskController } from "../controllers/project-task.controller";

const router = Router();
const controller = projectTaskController();

router.post("/", controller.createTask);
router.get("/", controller.getAllTasks);
router.get("/:id", controller.getTaskById);
router.put("/:id", controller.updateTask);
router.delete("/:id", controller.deleteTask);

export default router;