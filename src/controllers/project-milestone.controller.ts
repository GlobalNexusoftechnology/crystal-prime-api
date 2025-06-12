import { Request, Response, NextFunction } from "express";
import { MilestoneService } from "../services/project-milestone.service"
import { createMilestoneSchema, updateMilestoneSchema } from "../schemas/project-milestone.schema";

const service = MilestoneService();

export const milestoneController = () => {
  const createMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createMilestoneSchema.parse(req.body);
      const result = await service.createMilestone(parsed);
      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  };

  const getAllMilestones = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllMilestones();
      res.status(200).json({ status: "success", ...result });
    } catch (error) {
      next(error);
    }
  };

  const getMilestoneById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getMilestoneById(id);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  };

  const updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateMilestoneSchema.parse(req.body);
      const result = await service.updateMilestone(id, parsed);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  };

  const deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.deleteMilestone(id);
      res.status(200).json({ status: "success", message: "Milestone deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  return {
    createMilestone,
    getAllMilestones,
    getMilestoneById,
    updateMilestone,
    deleteMilestone,
  };
};
