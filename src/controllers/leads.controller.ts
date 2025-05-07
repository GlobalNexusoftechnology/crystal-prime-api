import { Request, Response, NextFunction } from "express";
import {
  createLeadSchema,
  updateLeadSchema,
} from "../schemas/leads.schema";
import {
  createLeadService,
  getAllLeadsService,
  getLeadByIdService,
  updateLeadService,
  softDeleteLeadService,
} from "../services/leads.service";

// Create Lead
export const createLeadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createLeadSchema.parse(req.body);
    const data = await createLeadService(validated);

    return res.status(201).json({
      status: "success",
      message: "Lead created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Get Lead by ID
export const getLeadByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const lead = await getLeadByIdService(id);

    return res.status(200).json({
      status: "success",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Leads
export const getAllLeadsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leads = await getAllLeadsService();

    return res.status(200).json({
      status: "success",
      data: leads,
    });
  } catch (error) {
    next(error);
  }
};

// Update Lead by ID
export const updateLeadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validated = updateLeadSchema.parse(req.body);
    const updatedLead = await updateLeadService(id, validated);

    return res.status(200).json({
      status: "success",
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    next(error);
  }
};

// Soft Delete Lead by ID
export const softDeleteLeadController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedLead = await softDeleteLeadService(id);

    return res.status(200).json({
      status: "success",
      message: "Lead soft deleted successfully",
      data: deletedLead,
    });
  } catch (error) {
    next(error);
  }
};
