import { Request, Response, NextFunction } from "express";
import * as attendanceService from "../services";

/** Staff Check-in */
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = res.locals.user;
    if (user.role.name === "Admin") {
      return res.status(403).json({ status: false, message: "Admin cannot check-in" });
    }

    const record = await attendanceService.checkIn(user.id);
    res.status(201).json({ status: true, message: "Check-in successful", data: record });
  } catch (err) {
    next(err);
  }
};

/** Staff Check-out */
export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = res.locals.user;
    if (user.role.name === "Admin") {
      return res.status(403).json({ status: false, message: "Admin cannot check-out" });
    }

    const record = await attendanceService.checkOut(user.id);
    res.json({ status: true, message: "Check-out successful", data: record });
  } catch (err) {
    next(err);
  }
};

/** Get staff attendance */
export const getAttendanceByStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = res.locals.user;
    const staffId = req.params.staffId;

    // Staff can only see their own attendance
    if (user.role.name !== "Admin" && staffId !== user.id) {
      return res.status(403).json({ status: false, message: "Access denied" });
    }

    const data = await attendanceService.getAttendanceByStaff(staffId);
    res.json({ status: true, message: "Attendance fetched", data });
  } catch (err) {
    next(err);
  }
};

/** Admin: Get all attendance */
export const getAllAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = res.locals.user;
    if (user.role.name !== "Admin") {
      return res.status(403).json({ status: false, message: "Only admin can view all attendance" });
    }

    const data = await attendanceService.getAllAttendance();
    res.json({ status: true, message: "All attendance records fetched", data });
  } catch (err) {
    next(err);
  }
};
