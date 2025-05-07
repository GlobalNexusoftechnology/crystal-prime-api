import { Request, Response, NextFunction } from "express";
import {
  createLeadSourceSchema,
  updateLeadSourceSchema,
} from "../schemas/lead-sources.schema";
import {
  createLeadSourceService,
  getAllLeadSourceService,
  getLeadSourceByIdService,
  softDeleteLeadSourceService,
  updateLeadSourceService,
} from "../services/lead-sources.service";

// create LeadSource
export const createLeadSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(req, "validated$$$$$$$$$")
    const validated = createLeadSourceSchema.parse(req.body);
    const data = await createLeadSourceService(validated.name);

    return res.status(201).json({
      status: "success",
      message: "Lead source created successfully",
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

// Get LeadSource By Id
export const getLeadSourceByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const leadSource = await getLeadSourceByIdService(id);

    return res.status(200).json({
      status: "success",
      data: leadSource,
    });
  } catch (error) {
    next(error);
  }
};

// Get All LeadSource
export const getAllLeadSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const leadSource = await getAllLeadSourceService();

    return res.status(200).json({
      status: "success",
      data: leadSource,
    });
  } catch (error) {
    next(error);
  }
};

// Update LeadSource By Id
export const updateLeadSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Validate the request body using Zod
    const updatedData = updateLeadSourceSchema.parse(req.body);

    // Call the service to update the LeadSource
    const updatedLeadSource = await updateLeadSourceService(id, updatedData);

    // Send the response with success message and updated data
    return res.status(200).json({
      status: "success",
      message: "LeadSource updated successfully",
      data: updatedLeadSource,
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete LeadSource by ID
export const softDeleteLeadSourceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Call the soft delete service
    const deletedLeadSource = await softDeleteLeadSourceService(id);

    // Return success response
    return res.status(200).json({
      status: "success",
      message: "LeadSource soft deleted successfully",
      data: deletedLeadSource,
    });
  } catch (error) {
    next(error);
  }
};
