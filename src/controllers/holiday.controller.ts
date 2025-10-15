// src/controllers/holidayController.ts
import { Request, Response, NextFunction } from "express";
import * as holidayService from "../services";
import { createHolidaySchema, updateHolidaySchema } from "../schemas";
import { findUserById } from "../services";

/** Create a new holiday */
export const createHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = createHolidaySchema.parse(req.body);
      const result = await holidayService.createHoliday(payload);
      res.status(201).json({ status: true, message: "Holiday created successfully", data: result });
    } catch (err) {
      next(err);
    }
  };

/** Get all holidays */
export const getAllHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await holidayService.getAllHolidays();
    res.json({ status: true, message: "Holiday list fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

/** Get holiday by ID */
export const getHolidayById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await holidayService.getHolidayById(id);
    res.json({ status: true, message: "Holiday fetched successfully", data });
  } catch (err) {
    next(err);
  }
};

/** Update holiday */
export const updateHoliday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = updateHolidaySchema.parse(req.body);
      const { id } = req.params;
      const data = await holidayService.updateHoliday(id, payload);
      res.json({ status: true, message: "Holiday updated successfully", data });
    } catch (err) {
      next(err);
    }
  };

/** Delete holiday */
export const deleteHoliday = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await holidayService.deleteHoliday(id);
    res.json({ status: true, message: "Holiday deleted successfully" });
  } catch (err) {
    next(err);
  }
};
