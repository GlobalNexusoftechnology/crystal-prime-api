import { Request, Response, NextFunction } from "express";
import { ProjectFollowupService } from "../services/project-followups.service";
import {
  createProjectFollowupSchema,
  updateProjectFollowupSchema,
} from "../schemas/project-followups.schema";

const service = ProjectFollowupService();

export const projectFollowupController = () => {
  // Create Followup
  const createFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createProjectFollowupSchema.parse(req.body);
      const result = await service.createFollowup(parsed);
      res.status(201).json({
        status: "success",
        message: "Project Follow-up created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get All Followups
  const getAllFollowups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllFollowups();
      res.status(200).json({
        status: "success",
        message: "All Project Follow-ups fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Followup by ID
  const getFollowupById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getFollowupById(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Project Follow-up fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Followup
  const updateFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = updateProjectFollowupSchema.parse(req.body);
      const result = await service.updateFollowup(req.params.id, parsed);
      res.status(200).json({
        status: "success",
        message: "Project Follow-up updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Followup
  const softDeleteFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.softDeleteFollowup(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Project Follow-up deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createFollowup,
    getAllFollowups,
    getFollowupById,
    updateFollowup,
    softDeleteFollowup,
  };
}; 