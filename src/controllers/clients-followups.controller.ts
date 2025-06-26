import { Request, Response, NextFunction } from "express";
import { ClientFollowupService } from "../services/clients-followups.service";
import {
  createClientFollowupSchema,
  updateClientFollowupSchema,
} from "../schemas/clients-followups.schema";

const service = ClientFollowupService();

export const clientFollowupController = () => {
  // Create Followup
  const createFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = createClientFollowupSchema.parse(req.body);
      // Map client_id to project_id and handle user_id null
      const mapped = {
        ...parsed,
        project_id: parsed.client_id,
        user_id: parsed.user_id ?? undefined,
        due_date: parsed.due_date ?? undefined,
        completed_date: parsed.completed_date ?? undefined,
        remarks: parsed.remarks ?? undefined,
      };
      delete (mapped as any).client_id;
      const result = await service.createFollowup(mapped);
      res.status(201).json({
        status: "success",
        message: "Client Follow-up created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get All Followups
  const getAllFollowups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getAllFollowups();
      res.status(200).json({
        status: "success",
        message: "All Client Follow-ups fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Followup by ID
  const getFollowupById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.getFollowupById(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Client Follow-up fetched",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Followup
  const updateFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const parsed = updateClientFollowupSchema.parse(req.body);
      // Map client_id to project_id and handle user_id null
      const mapped = {
        ...parsed,
        project_id: parsed.client_id,
        user_id: parsed.user_id ?? undefined,
        due_date: parsed.due_date ?? undefined,
        completed_date: parsed.completed_date ?? undefined,
        remarks: parsed.remarks ?? undefined,
      };
      delete (mapped as any).client_id;
      const result = await service.updateFollowup(req.params.id, mapped);
      res.status(200).json({
        status: "success",
        message: "Client Follow-up updated",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Soft Delete Followup
  const softDeleteFollowup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.softDeleteFollowup(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Client Follow-up deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  return {
    createFollowup,
    getAllFollowups,
    getFollowupById,
    updateFollowup,
    softDeleteFollowup,
  };
};
