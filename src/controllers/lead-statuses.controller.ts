import { Request, Response, NextFunction } from "express";
import {
  createLeadStatusSchema,
  updateLeadStatusSchema,
} from "../schemas/lead-statuses.schema";
import {
  createLeadStatusService,
  getAllLeadStatusService,
  getLeadStatusByIdService,
  softDeleteLeadStatusService,
  updateLeadStatusService,
} from "../services/lead-statuses.service";

// create LeadStatus
export const createLeadStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createLeadStatusSchema.parse(req.body);
    const data = await createLeadStatusService(validated.name);

    return res.status(201).json({
      status: "success",
      message: "Lead status created successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Get LeadStatus By Id
export const getLeadStatusByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const leadStatus = await getLeadStatusByIdService(id);

    return res.status(200).json({
      status: "success",
      data: leadStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Get All LeadStatus
export const getAllLeadStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leadStatus = await getAllLeadStatusService();

    return res.status(200).json({
      status: "success",
      data: leadStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Update LeadStatus By Id
export const updateLeadStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Validate the request body using Zod
    const updatedData = updateLeadStatusSchema.parse(req.body);

    // Call the service to update the LeadStatus
    const updatedLeadStatus = await updateLeadStatusService(id, updatedData);

    // Send the response with success message and updated data
    return res.status(200).json({
      status: "success",
      message: "Lead status updated successfully",
      data: updatedLeadStatus,
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete LeadStatus by ID
export const softDeleteLeadStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Call the soft delete service
    const deletedLeadStatus = await softDeleteLeadStatusService(id);

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "Lead status soft deleted successfully",
      data: deletedLeadStatus,
    });
  } catch (error) {
    next(error);
  }
};
