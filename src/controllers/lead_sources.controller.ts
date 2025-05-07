import { Request, Response, NextFunction } from "express";
import {
    createLeadSource,
    getLeadSourceById,
    getAllLeadSource,
    updateLeadSource,
    softDeleteLeadSource
}
    from "../services/lead_sources.service";
import { createLeadSourceSchema, updateLeadSourceSchema } from "../schemas/lead_sources.schema";

// create LeadSource
export const createLead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const validated = createLeadSourceSchema.parse(req.body);
        const data = await createLeadSource(validated.name);

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
export const getLeadById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id;
        const leadSource = await getLeadSourceById(id);

        return res.status(200).json({
            status: "success",
            data: leadSource,
        });
    } catch (error) {
        next(error);
    }
};

// Get All LeadSource
export const getAllLead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const leadSource = await getAllLeadSource();

        return res.status(200).json({
            status: "success",
            data: leadSource,
        });
    } catch (error) {
        next(error);
    }
};

// Update LeadSource By Id
export const updateLead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        // Validate the request body using Zod
        const updatedData = updateLeadSourceSchema.parse(req.body);

        // Call the service to update the LeadSource
        const updatedLeadSource = await updateLeadSource(id, updatedData);

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
export const softDeleteLead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        // Call the soft delete service
        const deletedLeadSource = await softDeleteLeadSource(id);

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


