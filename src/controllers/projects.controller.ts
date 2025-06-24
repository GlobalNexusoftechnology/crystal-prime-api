import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/projects.service";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/projects.schema";

const service = ProjectService();

export const ProjectController = () => {
  // Create Project
  const createProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsedData = createProjectSchema.parse(req.body); // Zod validation
      const result = await service.createProject(parsedData);
      res.status(201).json({
        status: "success",
        message: "Project project created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get All Project Projects
  const getAllProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllProject();
      res.status(200).json({
        status: "success",
        message: "All Project projects fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Project by ID
  const getProjectById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getProjectById(id);
      res.status(200).json({
        status: "success",
        message: "Project project fetched by id",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Project
  const updateProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsedData = updateProjectSchema.parse(req.body);
      const result = await service.updateProject(id, parsedData);
      res.status(200).json({
        status: "success",
        message: "Project project updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Project
  const softDeleteProject = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteProject(id);
      res.status(200).json({
        status: "success",
        message: "Project project deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createProject,
    getAllProject,
    getProjectById,
    updateProject,
    softDeleteProject,
  };
};
