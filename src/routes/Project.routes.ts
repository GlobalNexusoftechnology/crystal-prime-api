import { Router } from "express";
import { ProjectController } from "../controllers/Project.controller";

const router = Router();
const controller = ProjectController();

// Routes
router.post("/create-Project", controller.createProject);
router.get("/", controller.getAllProject);
router.get("/:id", controller.getProjectById);
router.put("/:id", controller.updateProject);
router.delete("/:id", controller.softDeleteProject);

export default router;
