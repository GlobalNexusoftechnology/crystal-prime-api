import { AppDataSource } from "../utils/data-source";
import { Attendance } from "../entities/attendance.entity";
import { Between } from "typeorm";
import ExcelJS from "exceljs";

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
export const getAllAttendance = async (filters: any = {}) => {
  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
  const skip = (page - 1) * limit;

  const query = attendanceRepo
    .createQueryBuilder("attendance")
    .leftJoinAndSelect("attendance.staff", "staff")
    .select([
      "attendance.id",
      "attendance.staffId", 
      "attendance.date",
      "attendance.inTime",
      "attendance.outTime",
      "attendance.totalHours",
      "attendance.created_at",
      "attendance.updated_at",
      "staff.id",
      "staff.first_name",
      "staff.last_name",
      "staff.email"
    ])
    .orderBy("attendance.date", "DESC");

  // Apply year filter
  if (filters.year) {
    query.andWhere("EXTRACT(YEAR FROM attendance.date) = :year", { year: filters.year });
  }

  // Apply month filter (1-12)
  if (filters.month) {
    query.andWhere("EXTRACT(MONTH FROM attendance.date) = :month", { month: filters.month });
  }

  // Apply search filter for staff names
  if (filters.searchText) {
    query.andWhere(
      "(LOWER(staff.first_name) LIKE LOWER(:searchText) OR LOWER(staff.last_name) LIKE LOWER(:searchText) OR LOWER(CONCAT(staff.first_name, ' ', staff.last_name)) LIKE LOWER(:searchText))",
      { searchText: `%${filters.searchText}%` }
    );
  }

  query.skip(skip).take(limit);

  const [attendanceRecords, total] = await query.getManyAndCount();

  return {
    data: attendanceRecords,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Export Attendance to Excel
export const exportAttendanceToExcel = async (filters: any = {}): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  // Set worksheet name
  worksheet.name = "Attendance Report";

  // Helper function to get all days in a month
  const getDaysInMonth = (year: number, month: number): Date[] => {
    const days: Date[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month - 1, day));
    }
    return days;
  };

  // Helper function to format time
  const formatTime = (time: string | null): string => {
    return time ? time : "-";
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get all staff members
  const staffQuery = attendanceRepo
    .createQueryBuilder("attendance")
    .leftJoinAndSelect("attendance.staff", "staff")
    .select([
      "staff.id",
      "staff.first_name", 
      "staff.last_name",
      "staff.email"
    ])
    .groupBy("staff.id, staff.first_name, staff.last_name, staff.email");

  // Apply search filter for staff
  if (filters.searchText) {
    staffQuery.andWhere(
      "(LOWER(staff.first_name) LIKE LOWER(:searchText) OR LOWER(staff.last_name) LIKE LOWER(:searchText) OR LOWER(CONCAT(staff.first_name, ' ', staff.last_name)) LIKE LOWER(:searchText))",
      { searchText: `%${filters.searchText}%` }
    );
  }

  const staffMembers = await staffQuery.getRawMany();

  // Get year and month for the report
  const year = filters.year || new Date().getFullYear();
  const month = filters.month || new Date().getMonth() + 1;

  // Get all days in the month
  const daysInMonth = getDaysInMonth(year, month);
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });

  // Get all attendance records for the month
  const attendanceQuery = attendanceRepo
    .createQueryBuilder("attendance")
    .leftJoinAndSelect("attendance.staff", "staff")
    .where("EXTRACT(YEAR FROM attendance.date) = :year", { year })
    .andWhere("EXTRACT(MONTH FROM attendance.date) = :month", { month });

  if (filters.searchText) {
    attendanceQuery.andWhere(
      "(LOWER(staff.first_name) LIKE LOWER(:searchText) OR LOWER(staff.last_name) LIKE LOWER(:searchText) OR LOWER(CONCAT(staff.first_name, ' ', staff.last_name)) LIKE LOWER(:searchText))",
      { searchText: `%${filters.searchText}%` }
    );
  }

  const attendanceRecords = await attendanceQuery.getMany();

  // Create a map for quick lookup
  const attendanceMap = new Map<string, Attendance>();
  attendanceRecords.forEach(record => {
    const recordDate =
      record.date instanceof Date
        ? record.date
        : new Date(record.date as unknown as string);
  
    const key = `${record.staffId}_${recordDate.toISOString().split('T')[0]}`;
    attendanceMap.set(key, record);
  });
  

  // Define columns
  const columns = [
    { header: "Sr No", key: "sr_no", width: 8 },
    { header: "Employee ID", key: "employee_id", width: 15 },
    { header: "Employee Name", key: "employee_name", width: 25 },
    { header: "Email", key: "email", width: 30 },
  ];

  // Add date columns for each day of the month
  daysInMonth.forEach((day, index) => {
    columns.push({
      header: `${day.getDate()}`,
      key: `day_${index + 1}`,
      width: 12
    });
  });

  // Add summary columns
  columns.push(
    { header: "Total Days", key: "total_days", width: 12 },
    { header: "Present Days", key: "present_days", width: 12 },
    { header: "Absent Days", key: "absent_days", width: 12 },
    { header: "Total Hours", key: "total_hours", width: 15 }
  );

  worksheet.columns = columns;

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "366092" }
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  // Add month/year header
  worksheet.insertRow(1, [`${monthName} ${year} - Attendance Report`]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 16, color: { argb: "366092" } };
  titleRow.alignment = { horizontal: "center" };
  titleRow.height = 30;

  // Merge title cells
  worksheet.mergeCells(1, 1, 1, columns.length);

  // Insert empty row
  worksheet.insertRow(2, []);

  // Add data rows
  let rowIndex = 3;
  let srNo = 1;

  for (const staff of staffMembers) {
    const row: any = {
      sr_no: srNo++,
      employee_id: staff.staff_id || "-",
      employee_name: `${staff.staff_first_name || ""} ${staff.staff_last_name || ""}`.trim(),
      email: staff.staff_email || "-"
    };

    let presentDays = 0;
    let totalHours = 0;

    // Process each day of the month
    daysInMonth.forEach((day, index) => {
      const key = `${staff.staff_id}_${day.toISOString().split('T')[0]}`;
      const attendance = attendanceMap.get(key);
      
      if (attendance) {
        const inTime = formatTime(attendance.inTime);
        const outTime = formatTime(attendance.outTime);
        const totalHoursStr = attendance.totalHours || "-";
        
        row[`day_${index + 1}`] = `${inTime} - ${outTime}`;
        
        if (attendance.inTime) {
          presentDays++;
        }
        
        // Calculate total hours (if available)
        if (attendance.totalHours) {
          const [hours, minutes] = attendance.totalHours.split(':').map(Number);
          totalHours += hours + (minutes / 60);
        }
      } else {
        row[`day_${index + 1}`] = "-";
      }
    });

    // Add summary data
    row.total_days = daysInMonth.length;
    row.present_days = presentDays;
    row.absent_days = daysInMonth.length - presentDays;
    row.total_hours = totalHours > 0 ? `${Math.floor(totalHours)}:${Math.round((totalHours % 1) * 60).toString().padStart(2, '0')}` : "-";

    worksheet.addRow(row);
    rowIndex++;
  }

  // Style data rows
  for (let i = 3; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    
    // Alternate row colors
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F8F9FA" }
      };
    }

    // Align employee data
    row.getCell(1).alignment = { horizontal: "center" }; // Sr No
    row.getCell(2).alignment = { horizontal: "center" }; // Employee ID
    row.getCell(3).alignment = { horizontal: "left" };   // Employee Name
    row.getCell(4).alignment = { horizontal: "left" };   // Email

    // Align date columns
    for (let j = 5; j <= 5 + daysInMonth.length - 1; j++) {
      row.getCell(j).alignment = { horizontal: "center" };
    }

    // Align summary columns
    for (let j = 5 + daysInMonth.length; j <= columns.length; j++) {
      row.getCell(j).alignment = { horizontal: "center" };
    }

    row.height = 20;
  }

  // Add borders
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    if (column.width) {
      column.width = Math.min(column.width + 2, 30);
    }
  });

  return workbook;
};
