import { Request, Response, NextFunction } from "express";
import { CreateLeadFollowupSchema, UpdateLeadFollowupSchema } from "../schemas/lead-followups.schema";
import {
    createFollowupService,
    getAllFollowupsService,
    getFollowupByIdService,
    updateFollowupService,
    softDeleteFollowupService,
} from "../services/lead-followups.service";

// Create Followup
export const createFollowupController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const validated = CreateLeadFollowupSchema.parse(req.body);
        const followup = await createFollowupService(validated);

        res.status(201).json({
            status: "success",
            message: "Followup created successfully",
            data: followup,
        });
    } catch (err) {
        next(err);
    }
};

// Get All Followups
export const getAllFollowupsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const followups = await getAllFollowupsService();
        res.status(200).json({
            status: "success",
            message: "Followups fetched successfully",
            data: followups,
        });
    } catch (err) {
        next(err);
    }
};

// Get Followup by ID
export const getFollowupByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const followup = await getFollowupByIdService(id);
        res.status(200).json({
            status: "success",
            message: "Followup fetched successfully",
            data: followup,
        });
    } catch (err) {
        next(err);
    }
};

// Update Followup
export const updateFollowupController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        // Validate the request body using Zod
        const updatedData = UpdateLeadFollowupSchema.parse(req.body);

        const updated = await updateFollowupService(id, updatedData);
        res.status(200).json({
            status: "success",
            message: "Followup updated successfully",
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

// Soft Delete
export const softDeleteFollowupController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const result = await softDeleteFollowupService(id);

        // Return success response
        return res.status(200).json({
            status: "success",
            message: "Lead followups soft deleted successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
