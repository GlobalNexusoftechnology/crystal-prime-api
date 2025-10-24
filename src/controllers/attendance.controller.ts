import { Request, Response, NextFunction } from "express";
import * as attendanceService from "../services";
import { findUserById } from "../services";

/** Staff Check-in */
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.user.id;
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
    const data = await attendanceService.getAttendanceByStaff(staffId);
    res.json({ status: true, message: "Attendance fetched", data });
  } catch (err) {
    next(err);
  }
};

/** Admin: Get all attendance */
export const getAllAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const searchText = req.query.searchText as string | undefined;

    const filters = {
      page,
      limit,
      year,
      month,
      searchText
    };

    const result = await attendanceService.getAllAttendance(filters);
    res.status(200).json({
      status: 'success',
      message: 'Attendance records fetched successfully',
      data: { list: result.data, pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
};

/** Export Attendance to Excel */
export const exportAttendanceExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const searchText = req.query.searchText as string | undefined;

    const filters = {
      year,
      month,
      searchText
    };

    const workbook = await attendanceService.exportAttendanceToExcel(filters);

    // Generate filename with month/year
    const yearStr = year || new Date().getFullYear();
    const monthStr = month ? new Date(yearStr, month - 1).toLocaleDateString('en-US', { month: 'long' }) : new Date().toLocaleDateString('en-US', { month: 'long' });
    const filename = `attendance_${monthStr}_${yearStr}_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting attendance:", error);
    next(error);
  }
};

// Get today's attendance status for a staff
export const getTodayStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const staffId = req.params.staffId;
    const data = await attendanceService.getTodayAttendance(staffId);

    if (!data) {
      return res.json({
        status: true,
        message: "No attendance record found for today",
        data: { isCheckedIn: false },
      });
    }

    const isCheckedIn = !!data.inTime && !data.outTime;

    res.json({
      status: true,
      message: "Today's attendance status fetched",
      data: {
        isCheckedIn,
        checkInTime: data.inTime,
        checkOutTime: data.outTime,
      },
    });
  } catch (err) {
    next(err);
  }
};
