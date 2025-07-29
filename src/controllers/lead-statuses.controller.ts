import { Request, Response, NextFunction } from "express";
import { LeadStatusService } from "../services/lead-statuses.service";
import {
  createLeadStatusSchema,
  updateLeadStatusSchema,
} from "../schemas/lead-statuses.schema";

const service = LeadStatusService();

export const leadStatusController = () => {
  // Create Lead Status
  const createLeadStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createLeadStatusSchema.parse(req.body);
      const result = await service.createLeadStatus(parsed);
      res
        .status(201)
        .json({
          status: "success",
          message: `${result.name} created`,
          data: result,
        });
    } catch (error) {
      next(error);
    }
  };

  // Get All Lead Statuses
  const getAllLeadStatuses = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const filters = {
        page,
        limit
      };

      const result = await service.getAllLeadStatuses(filters);

      res.status(200).json({
        status: "success",
        data: { list: result.data, pagination: result.pagination },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead Status by ID
  const getLeadStatusById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadStatusById(id);
      res
        .status(200)
        .json({
          status: "success",
          message: "Lead Status fetched",
          data: result,
        });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead Status
  const updateLeadStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsed = updateLeadStatusSchema.parse(req.body);
      const result = await service.updateLeadStatus(id, parsed);
      res
        .status(200)
        .json({
          status: "success",
          message: `${result.name} updated`,
          data: result,
        });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead Status
  const softDeleteLeadStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLeadStatus(id);
      res
        .status(200)
        .json({
          status: "success",
          message: "Lead Status deleted",
          data: result,
        });
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
