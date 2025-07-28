import { Request, Response, NextFunction } from "express";
import {
  createLeadTypeSchema,
  updateLeadTypeSchema,
} from "../schemas/lead-type.schema";
import { LeadTypeService } from "../services/lead-types.service";

const service = LeadTypeService();

export const leadTypeController = () => {
  // Create Lead Type
  const createLeadType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsedData = createLeadTypeSchema.parse(req.body); // Validating input data
      const result = await service.createLeadType(parsedData);
      res.status(201).json({
        status: "success",
        message: `${result.name} created`,
        data: result,
      });
    } catch (error) {
      next(error); // Passing error to the error handling middleware
    }
  };

  // Get All Lead Types
  const getAllLeadTypes = async (
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

      const result = await service.getAllLeadTypes(filters);
      res.status(200).json({
        status: "success",
        data: { list: result.data, pagination: result.pagination },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Lead Type by ID
  const getLeadTypeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.getLeadTypeById(id);
      res.status(200).json({
        status: "success",
        message: "Lead Type fetched by id",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Lead Type
  const updateLeadType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const parsedData = updateLeadTypeSchema.parse(req.body); // Validating input data
      const result = await service.updateLeadType(id, parsedData);
      res.status(200).json({
        status: "success",
        message: `${result.name} updated`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Lead Type
  const softDeleteLeadType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteLeadType(id);
      res.status(200).json({
        status: "success",
        message: "Lead Type deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Return the controller methods
  return {
    createLeadType,
    getAllLeadTypes,
    getLeadTypeById,
    updateLeadType,
    softDeleteLeadType,
  };
};
