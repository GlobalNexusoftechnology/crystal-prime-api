import { Request, Response, NextFunction } from "express";
import { LeadSourceService } from "../services/lead-sources.service";
import { createLeadSourceSchema, updateLeadSourceSchema } from "../schemas/lead-sources.schema";

const service = LeadSourceService();

export const leadSourceController = () => {

  // Create Lead Source
  const createLeadSource = async (req: Request, res: Response, next: NextFunction) => {
    try {

      const parsedData = createLeadSourceSchema.parse(req.body);  // Validating input data
      const result = await service.createLeadSource(parsedData);
      res.status(201).json({ status: "success", message: "Lead Source created", data: result });
    } catch (error) {
      next(error);  // Passing error to the error handling middleware
    }
  };

  // Get All Lead Sources
  const getAllLeadSources = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      const result = await service.getAllLeadSources({
        search: search as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        sortBy: (sortBy as any) || 'created_at',
        sortOrder: (sortOrder as any) || 'DESC',
      });

      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead Source by ID
  const getLeadSourceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadSourceById(id);
      res.status(200).json({ status: "success", message: "Lead Source fetched by id", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead Source
  const updateLeadSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsedData = updateLeadSourceSchema.parse(req.body);  // Validating input data
      const result = await service.updateLeadSource(id, parsedData);
      res.status(200).json({ status: "success", message: "Lead Source updated", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead Source
  const softDeleteLeadSource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLeadSource(id);
      res.status(200).json({ status: "success", message: "Lead Source deleted", data: result });
    } catch (error) {
      next(error);
    }
  };

  // Return the controller methods
  return {
    createLeadSource,
    getAllLeadSources,
    getLeadSourceById,
    updateLeadSource,
    softDeleteLeadSource,
  };
};

