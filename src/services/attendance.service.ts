import { AppDataSource } from "../utils/data-source";
import { Attendance } from "../entities/attendance.entity";
import { Between } from "typeorm";

const attendanceRepo = AppDataSource.getRepository(Attendance);

// Staff check-in
export const checkIn = async (staffId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
  
    const existing = await attendanceRepo.findOne({
      where: { staffId, date: Between(today, tomorrow) },
    });
    if (existing) throw new Error("Already checked in today");
  
    const now = new Date();
    const inTime = now.toTimeString().split(" ")[0];
  
    const record = attendanceRepo.create({ staffId, inTime, date: today });
    return await attendanceRepo.save(record);
  };

// Staff check-out
export const checkOut = async (staffId: string) => {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of day
  
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // start of next day
  
    // Find attendance record for today
    const record = await attendanceRepo.findOne({
      where: {
        staffId,
        date: Between(today, tomorrow),
      },
    });
  
    if (!record) throw new Error("You haven't checked in today");
    if (record.outTime) throw new Error("Already checked out");
  
    // Record current time as outTime
    const now = new Date();
    const outTime = now.toTimeString().split(" ")[0];
  
    // Calculate total hours
    const inTimeDate = new Date(`${today.toISOString().split("T")[0]}T${record.inTime}`);
    const outTimeDate = now;
    const diffMs = outTimeDate.getTime() - inTimeDate.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
    record.outTime = outTime;
    record.totalHours = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  
    return await attendanceRepo.save(record);
  };

// Get staff attendance
export const getAttendanceByStaff = async (staffId: string) => {
  return await attendanceRepo.find({ where: { staffId }, order: { date: "DESC" } });
};

// Admin: get all attendance records
export const getAllAttendance = async () => {
  return await attendanceRepo.find({ relations: ["staff"], order: { date: "DESC" } });
};
