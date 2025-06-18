import { Request, Response, NextFunction } from "express";
import { DailyTaskEntryService } from "../services/daily-task.service";
import {
  createDailyTaskEntrySchema,
  updateDailyTaskEntrySchema,
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
      const result = await service.getAllEntries();
      res.status(200).json({
        status: "success",
        message: "All daily task entries fetched",
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
    softDeleteEntry,
  };
};
