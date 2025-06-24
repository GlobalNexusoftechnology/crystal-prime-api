import { Router } from "express";
import { ProjectController } from "../controllers/projects.controller";

const router = Router();
const controller = ProjectController();

// Routes
router.post("/", controller.createProject);
router.get("/", controller.getAllProject);
router.get("/:id", controller.getProjectById);
router.put("/:id", controller.updateProject);
router.delete("/:id", controller.softDeleteProject);

export default router;
