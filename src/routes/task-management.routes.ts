// src/routes/taskRoutes.ts
import express from "express";
import { taskController } from "../controllers/task-management.controller"; // Import your taskController

const router = express.Router();

const controller = taskController(); 

// POST /api/tasks
router.post("/", controller.createTask);

// GET /api/tasks
router.get("/", controller.getAllTasks);

// GET /api/tasks/:id
router.get("/:id", controller.getTaskById);

// PUT /api/tasks/:id
router.put("/:id", controller.updateTask);

// DELETE /api/tasks/:id
router.delete("/:id", controller.softDeleteTask);

// GET /api/tasks/export/excel
router.get("/export/excel", controller.exportTasksExcelController);

export default router;