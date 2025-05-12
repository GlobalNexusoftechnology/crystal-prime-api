import { Request, Response, NextFunction } from "express";
import { LeadFollowupService } from "../services/lead-followups.service";
import { CreateLeadFollowupSchema, UpdateLeadFollowupSchema } from "../schemas/lead-followups.schema";

const service = LeadFollowupService();

export const leadFollowupController = () => {

  // Create
  const createLeadFollowup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = CreateLeadFollowupSchema.parse(req.body);
      const result = await service.createLeadFollowup(parsed);
      res.status(201).json({ status: "success", message: "Lead Followup created", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get All
  const getAllLeadFollowups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.getAllLeadFollowups();
      res.status(200).json({ status: "success", message: "All Lead Followups fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get by ID
  const getLeadFollowupById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadFollowupById(id);
      res.status(200).json({ status: "success", message: "Lead Followup fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Update
  const updateLeadFollowup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = UpdateLeadFollowupSchema.parse(req.body);
      const result = await service.updateLeadFollowup(id, parsed);
      res.status(200).json({ status: "success", message: "Lead Followup updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Soft Delete
  const softDeleteLeadFollowup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLeadFollowup(id);
      res.status(200).json({ status: "success", message: "Lead Followup deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  return {
    createLeadFollowup,
    getAllLeadFollowups,
    getLeadFollowupById,
    updateLeadFollowup,
    softDeleteLeadFollowup,
  };
};

