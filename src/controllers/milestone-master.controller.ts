import { Request, Response, NextFunction } from "express";
import { ProjectMilestoneMasterService } from "../services/milestone-master.service";
import {
  createMilestoneMasterSchema,
  updateMilestoneMasterSchema,
} from "../schemas/milestone-master.schema";

const service = ProjectMilestoneMasterService();

export const milestoneMasterController = () => {
    // create
  const createMaster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createMilestoneMasterSchema.parse(req.body);
      const result = await service.createMilestone(parsed);
      res.status(201).json({ status: "success", message: "Milestone created", data: result });
    } catch (err) {
      next(err);
    }
  };

  // get All
  const getAllMaster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllMilestone();
      res.status(200).json({ status: "success", message: "Milestone fetch ", data: result });
    } catch (err) {
      next(err);
    }
  };

  // get by id
  const getByIdMaster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getByIdMilestone(req.params.id);
      res.status(200).json({ status: "success", message: "Milestone fetch ", data: result });
    } catch (err) {
      next(err);
    }
  };

  // update
  const updateMaster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateMilestoneMasterSchema.parse(req.body);
      const result = await service.updateMilestone(req.params.id, parsed);
      res.status(200).json({ status: "success", message: "Milestone updated", data: result });
    } catch (err) {
      next(err);
    }
  };

  // delete
  const deleteMaster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.softDeleteMilestone(req.params.id);
      res.status(200).json({ status: "success", message: "Milestone deleted", data: result });
    } catch (err) {
      next(err);
    }
  };

  return { createMaster, getAllMaster, getByIdMaster, updateMaster, deleteMaster };
};
