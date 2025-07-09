import { Router } from "express";
import { ProjectController } from "../controllers/projects.controller";
import { deserializeUser, requireUser } from "../middleware";

const router = Router();
const controller = ProjectController();

router.use(deserializeUser, requireUser);

// Routes
router.post("/", controller.createProject);
router.get("/", controller.getAllProject);
router.get("/:id", controller.getProjectById);
router.put("/:id", controller.updateProject);
router.delete("/:id", controller.softDeleteProject);

export default router;
