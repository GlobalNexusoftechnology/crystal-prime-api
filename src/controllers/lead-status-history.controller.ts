import { Request, Response, NextFunction } from "express";
import { LeadStatusHistoryService } from "../services/lead-status-history.service";
import {
  createLeadStatusHistorySchema,
  updateLeadStatusHistorySchema,
} from "../schemas/lead-status-history.schema";

const service = LeadStatusHistoryService();

export const leadStatusHistoryController = () => {

  // Create
  const createLeadStatusHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createLeadStatusHistorySchema.parse(req.body);
      const result = await service.createStatusHistory(parsed);
      res.status(201).json({ status: "success", message: "Lead Status History created", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Get All
  const getAllLeadStatusHistories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { leadId } = req.query;
      let result;

      if (leadId) {
        result = await service.getAllStatusHistories(leadId as string);
      } else {
        result = await service.getAllStatusHistories();
      }

      res.status(200).json({ 
        status: "success", 
        message: "Lead Status Histories fetched", 
        data: result 
      });
    } catch (error) {
      next(error);
    }
  };

  //  Get by ID
  const getLeadStatusHistoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getStatusHistoryById(id);
      res.status(200).json({ status: "success", message: "Lead Status History fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Update
  const updateLeadStatusHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateLeadStatusHistorySchema.parse(req.body);
      const result = await service.updateStatusHistory(id, parsed);
      res.status(200).json({ status: "success", message: "Lead Status History updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  //  Soft Delete
  const softDeleteLeadStatusHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteStatusHistory(id);
      res.status(200).json({ status: "success", message: "Lead Status History deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  return {
    createLeadStatusHistory,
    getAllLeadStatusHistories,
    getLeadStatusHistoryById,
    updateLeadStatusHistory,
    softDeleteLeadStatusHistory,
  };
};
