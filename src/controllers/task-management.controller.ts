// src/controllers/taskController.ts
import { Request, Response, NextFunction } from "express";
import { TaskService } from "../services/task-management.service";
import {
    CreateTaskSchema,
    UpdateTaskSchema,
} from "../schemas/task-management.schema";
import path from "path";
import fs from "fs/promises"

const service = TaskService();

export const taskController = () => {


    const createTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = CreateTaskSchema.parse(req.body);
            const result = await service.createTask(parsed);
            res.status(201).json({ status: "success", message: "Task created", data: result });
        } catch (error) {
            next(error);
        }
    };


    const getAllTasks = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await service.getAllTasks();
            res.status(200).json({ status: "success", message: "All tasks fetched", data: result });
        } catch (error) {
            next(error);
        }
    };

    const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await service.getTaskById(id);
            res.status(200).json({ status: "success", message: "Task fetched", data: result });
        } catch (error) {
            next(error);
        }
    };


    const updateTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const parsedBody = UpdateTaskSchema.parse(req.body);
            const result = await service.updateTask(id, parsedBody);
            res.status(200).json({ status: "success", message: "Task updated", data: result });
        } catch (error) {
            next(error);
        }
    };


    const softDeleteTask = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const result = await service.softDeleteTask(id);
            res.status(200).json({ status: "success", message: "Task deleted", data: result });
        } catch (error) {
            next(error);
        }
    };


    const exportTasksExcelController = async (req: Request, res: Response) => {
        try {
            const workbook = await service.exportTasksToExcel();

            // Define the export directory within 'public'
            const exportDir = path.join(__dirname, "..", "..", "public", "exports");
            await fs.mkdir(exportDir, { recursive: true });

            const filename = `tasks_${Date.now()}.xlsx`;
            const filepath = path.join(exportDir, filename);

            await workbook.xlsx.writeFile(filepath);

            // Construct the URL for the client to download the file
            const fileURL = `${req.protocol}://${req.get("host")}/exports/${filename}`;

            res.json({ fileURL });
        } catch (error) {
            console.error("Error exporting tasks:", error);
            res.status(500).json({ message: "Failed to export tasks" });
        }
    };

    return {
        createTask,
        getAllTasks,
        getTaskById,
        updateTask,
        softDeleteTask,
        exportTasksExcelController,
    };
};