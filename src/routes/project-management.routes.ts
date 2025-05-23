// src/routes/projectRoutes.ts
import express from "express";
import { projectController } from "../controllers/project-management.controller"; // Import your projectController

const router = express.Router();
const controller = projectController(); // Initialize the projectController

router.post("/", controller.createProject);
router.get("/", controller.getAllProjects);
router.get("/:id", controller.getProjectById);
router.put("/:id", controller.updateProject);
router.delete("/:id", controller.softDeleteProject);

router.get("/export/excel", controller.exportProjectsExcelController);

export default router;