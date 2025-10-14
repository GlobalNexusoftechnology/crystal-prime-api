import { Request, Response, NextFunction } from "express";
import * as attendanceService from "../services";
import { findUserById } from "../services";

/** Staff Check-in */
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.id;
    const userData = await findUserById(userId);
    const userRole = userData.role.role;
    
    if (userRole !== "admin") {
      return res.status(403).json({ status: false, message: "Admin cannot check-in" });
    }

    const record = await attendanceService.checkIn(userId);
    res.status(201).json({ status: true, message: "Check-in successful", data: record });
  } catch (err) {
    next(err);
  }
};

/** Staff Check-out */
export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.id;
    const userData = await findUserById(userId);
    const userRole = userData.role.role;
    
        if (userRole !== "admin") {
      return res.status(403).json({ status: false, message: "Admin cannot check-out" });
    }

    const record = await attendanceService.checkOut(userId);
    res.json({ status: true, message: "Check-out successful", data: record });
  } catch (err) {
    next(err);
  }
};

/** Get staff attendance */
export const getAttendanceByStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffId = req.params.staffId;
    const userId = res.locals.user.id;
    const userData = await findUserById(userId);
    const userRole = userData.role.role;
    
    // Staff can only see their own attendance
    if (userRole !== "admin" && staffId !== userId) {
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
    const userId = res.locals.user.id;
    const userData = await findUserById(userId);
    const userRole = userData.role.role;
    
    if (userRole !== "admin") {
      return res.status(403).json({ status: false, message: "Only admin can view all attendance" });
    }

    const data = await attendanceService.getAllAttendance();
    res.json({ status: true, message: "All attendance records fetched", data });
  } catch (err) {
    next(err);
  }
};
