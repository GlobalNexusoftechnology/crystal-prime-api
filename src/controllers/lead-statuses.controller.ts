import { Request, Response, NextFunction } from "express";
import { LeadStatusService } from "../services/lead-statuses.service";
import { createLeadStatusSchema, updateLeadStatusSchema } from "../schemas/lead-statuses.schema";

const service = LeadStatusService();

export const leadStatusController = () => {

  // Create Lead Status
  const createLeadStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createLeadStatusSchema.parse(req.body);
      const result = await service.createLeadStatus(parsed);
      res.status(201).json({ status: "success", message: "Lead Status created", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Get All Lead Statuses
  const getAllLeadStatuses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      const result = await service.getAllLeadStatuses({
        search: search as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sortBy: (sortBy as any) || 'created_at',
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead Status by ID
  const getLeadStatusById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadStatusById(id);
      res.status(200).json({ status: "success", message: "Lead Status fetched", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead Status
  const updateLeadStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateLeadStatusSchema.parse(req.body);
      const result = await service.updateLeadStatus(id, parsed);
      res.status(200).json({ status: "success", message: "Lead Status updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead Status
  const softDeleteLeadStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLeadStatus(id);
      res.status(200).json({ status: "success", message: "Lead Status deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  return {
    createLeadStatus,
    getAllLeadStatuses,
    getLeadStatusById,
    updateLeadStatus,
    softDeleteLeadStatus,
  };
};

