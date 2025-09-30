import { Request, Response, NextFunction } from "express";
import { DailyTaskEntryService } from "../services/daily-task.service";
import {
  createDailyTaskEntrySchema,
  updateDailyTaskEntrySchema,
  updateDailyTaskStatusSchema,
} from "../schemas/daily-task.schema";

const service = DailyTaskEntryService();

export const dailyTaskEntryController = () => {
  const createEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createDailyTaskEntrySchema.parse(req.body);
      const result = await service.createEntry(parsed);
      res.status(201).json({
        status: "success",
        message: "Daily task entry created",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const getAllEntries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { task_id } = req.query;
      
      if (!task_id) {
        return res.status(400).json({
          status: "error",
          message: "Task ID is required",
        });
      }
      
      const result = await service.getAllEntries(task_id as string);
      res.status(200).json({
        status: "success",
        message: "Daily task entries fetched for the specified task",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const getEntryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.getEntryById(id);
      res.status(200).json({
        status: "success",
        message: "Single entry fetched",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const updateEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateDailyTaskEntrySchema.parse(req.body);
      const result = await service.updateEntry(id, parsed);
      res.status(200).json({
        status: "success",
        message: "Daily task entry updated",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const updateEntryStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parsed = updateDailyTaskStatusSchema.parse(req.body);
      const result = await service.updateEntryStatus(id, parsed.status);
      res.status(200).json({
        status: "success",
        message: "Daily task status updated successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  const softDeleteEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await service.softDeleteEntry(id);
      res.status(200).json({
        status: "success",
        message: "Entry soft deleted",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  return {
    createEntry,
    getAllEntries,
    getEntryById,
    updateEntry,
    updateEntryStatus,
    softDeleteEntry,
  };
};
