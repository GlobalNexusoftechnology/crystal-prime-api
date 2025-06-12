import { Request, Response, NextFunction } from "express";
import { ProjectTemplateService } from "../services/project-templates.service";
import {
  createProjectTemplateSchema,
  updateProjectTemplateSchema,
} from "../schemas/project-templates.schema";

const service = ProjectTemplateService();

export const projectTemplateController = () => {
  //  Create
  const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProjectTemplateSchema.parse(req.body);
      const result = await service.createTemplate(parsed);
      res.status(201).json({
        status: "success",
        message: "Project template created",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  //  Get All
  const getAllTemplates = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllTemplates();
      res.status(200).json({
        status: "success",
        message: "get All template",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  //  Get By ID
  const getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getTemplateById(id);
      res.status(200).json({
        status: "success",
        message: "get by id template",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  //  Update
  const updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateProjectTemplateSchema.parse(req.body);
      const result = await service.updateTemplate(id, parsed);
      res.status(200).json({
        status: "success",
        message: "Project template updated",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  //  Soft Delete
  const softDeleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteTemplate(id);
      res.status(200).json({
        status: "success",
        message: "Project template deleted",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  return {
    createTemplate,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    softDeleteTemplate,
  };
};
