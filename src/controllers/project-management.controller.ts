// src/controllers/projectController.ts
import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project-management.service"; // Import your ProjectService
import {
    CreateProjectSchema,
    UpdateProjectSchema,
} from "../schemas/project-management.schema"; // Import your Project Zod schemas
import path from "path";
import fs from "fs/promises";

// Initialize the ProjectService
const service = ProjectService();

export const projectController = () => {

    const createProject = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const parsed = CreateProjectSchema.parse(req.body);
            const result = await service.createProject(parsed);
            res.status(201).json({ status: "success", message: "Project created", data: result });
        } catch (error) {
            next(error); // Pass error to global error handler
        }
    };

    const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await service.getAllProjects();
            res.status(200).json({ status: "success", message: "All Projects fetched", data: result });
        } catch (error) {
            next(error);
        }
    };


    const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.params is already parsed by validateParams middleware
            const { id } = req.params;
            const result = await service.getProjectById(id);
            res.status(200).json({ status: "success", message: "Project fetched", data: result });
        } catch (error) {
            next(error);
        }
    };


    const updateProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.params and req.body are already parsed by validation middlewares
            const { id } = req.params;
            const parsed = UpdateProjectSchema.parse(req.body);
            const result = await service.updateProject(id, parsed);
            res.status(200).json({ status: "success", message: "Project updated", data: result });
        } catch (error) {
            next(error);
        }
    };


    const softDeleteProject = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // req.params is already parsed by validateParams middleware
            const { id } = req.params;
            const result = await service.softDeleteProject(id);
            res.status(200).json({ status: "success", message: "Project deleted", data: result });
        } catch (error) {
            next(error);
        }
    };

    const exportProjectsExcelController = async (req: Request, res: Response) => {
        try {
            const workbook = await service.exportProjectsToExcel();

            // Define the export directory within 'public'
            const exportDir = path.join(__dirname, "..", "..", "public", "exports");
            await fs.mkdir(exportDir, { recursive: true }); // Ensure directory exists

            const filename = `projects_${Date.now()}.xlsx`;
            const filepath = path.join(exportDir, filename);

            await workbook.xlsx.writeFile(filepath); // Write the workbook to the file system

            // Construct the URL for the client to download the file
            const fileURL = `${req.protocol}://${req.get("host")}/exports/${filename}`;

            res.json({ fileURL }); // Send the URL back to the client
        } catch (error) {
            console.error("Error exporting projects:", error);
            res.status(500).json({ message: "Failed to export projects" });
        }
    };

    return {
        createProject,
        getAllProjects,
        getProjectById,
        updateProject,
        softDeleteProject,
        exportProjectsExcelController,
    };
};