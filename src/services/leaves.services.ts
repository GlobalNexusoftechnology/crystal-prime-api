import { Leave, User } from "../entities";
import { LeaveCreateInput, LeaveUpdateInput } from "../schemas";
import { AppDataSource } from "../utils/data-source";
import { NotificationService } from "./notification.service";
import { NotificationType } from "../entities/notification.entity";
import {sendLeaveApplicationEmail} from "../utils/email"
const leaveRepo = AppDataSource.getRepository(Leave);
const userRepo = AppDataSource.getRepository(User)

// Function to validate and swap dates if needed
const validateAndFormatDates = (fromDate: Date, toDate: Date): { startDate: Date; endDate: Date } => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  // If toDate is before fromDate, swap them
  if (end < start) {
    return { startDate: end, endDate: start };
  }
  
  return { startDate: start, endDate: end };
};

// Function to calculate total leave days (excluding weekends)
const calculateLeaveDays = (fromDate: Date, toDate: Date, leaveType?: string): number => {
  const { startDate, endDate } = validateAndFormatDates(fromDate, toDate);
  
  // Handle half-day leaves
  if (leaveType === "Half Day") {
    return 0.5;
  }
  
  // Handle single day leaves (when fromDate and toDate are the same)
  if (startDate.getTime() === endDate.getTime()) {
    // Check if it's a weekend
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 0; // Weekend, no leave days
    }
    return 1; // Single working day
  }
  
  // Handle multi-day leaves
  let leaveDays = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      leaveDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return leaveDays;
};

export const applyLeave = async (data: LeaveCreateInput) => {

  const adminUsers = await userRepo.find({
    where: { role: { role: "admin" } },
    relations: ["role"]
  });

  const leave = leaveRepo.create(data);
  const savedLeave = await leaveRepo.save(leave);
  // Fetch leave with staff info
  const leaveWithStaff = await leaveRepo.findOne({
    where: { id: savedLeave.id },
    relations: ["staff"],
    select: {
      id: true,
      staffId: true,
      appliedDate: true,
      fromDate: true,
      toDate: true,
      leaveCategory: true,
      leaveType: true,
      description: true,
      status: true,
      adminRemark: true,
      staff: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone_number: true,
      },
    },
  });
  if (!leaveWithStaff || !leaveWithStaff.staff) {
    throw new Error("Staff not found for the applied leave");
  }

  const staffName = `${leaveWithStaff.staff.first_name} ${leaveWithStaff.staff.last_name || ""}`.trim();


  const fromDate = new Date(savedLeave.fromDate);
  const toDate = new Date(savedLeave.toDate);
  const appliedDate = new Date(savedLeave.appliedDate); 

  const notificationService = NotificationService();
  for (const admin of adminUsers) {
    await notificationService.createNotification(
      admin.id,
      NotificationType.LEAVE_APPLIED,
      `${staffName} has applied for leave from ${fromDate.toDateString()} to ${toDate.toDateString()}`,
      {
        leaveId: savedLeave.id,
        staffId: savedLeave.staffId,
        leaveType: savedLeave.leaveType,
        fromDate: savedLeave.fromDate,
        toDate: savedLeave.toDate,
        description: savedLeave.description
      }
    );
  }
 
  const recipientEmail = process.env.EMAI_LEAVE_NOTIFY!;
  // Send email notification
     await sendLeaveApplicationEmail(
  recipientEmail,
  staffName,
  savedLeave.leaveType,
  fromDate.toDateString(),
  toDate.toDateString(),
  appliedDate.toDateString(),
  savedLeave.description,
  savedLeave.id
);
  return {
    ...leaveWithStaff,
    staffName, 
  };
};

export const updateLeaveStatus = async (id: string, data: LeaveUpdateInput) => {
  //const leave = await leaveRepo.findOneBy({ id });
  const leave = await leaveRepo.findOne({
  where: { id },
  relations: ["staff"]
});

  if (!leave) throw new Error("Leave not found");
  Object.assign(leave, data);

  const updatedLeave = await leaveRepo.save(leave);

   const notificationService = NotificationService(); 
   await notificationService.createNotification(
   leave.staff.id,
   NotificationType.LEAVE_STATUS_UPDATED,
  `Your leave request has been ${updatedLeave.status.toLowerCase()}.`,
  {
    leaveId: updatedLeave.id,
    leaveType: updatedLeave.leaveType,
    leaveCategory: updatedLeave.leaveCategory,
    fromDate: updatedLeave.fromDate,
    toDate: updatedLeave.toDate,
    description: updatedLeave.description,
  }
);

  return await leaveRepo.save(leave);
};

// export const getAllLeaves = async () => {
//   return await leaveRepo.find({ relations: ["staff"] });
// };

export const getAllLeaves = async () => {
  const leaves = await leaveRepo.find({ 
    relations: ["staff"],
    order: { appliedDate: "DESC" }
  });

  // Calculate leave days for each leave
  const leavesWithDays = leaves.map(leave => {
    const { startDate, endDate } = validateAndFormatDates(
      new Date(leave.fromDate), 
      new Date(leave.toDate)
    );
    
    const leaveDays = calculateLeaveDays(startDate, endDate, leave.leaveType);
    
    return {
      ...leave,
      leaveDays, // Sirf yeh field return karo
      hasDateError: leave.fromDate > leave.toDate
    };
  });

  return leavesWithDays;
};

export const getLeavesByStaff = async (staffId: string) => {
  const leaves = await leaveRepo.find({ 
    where: { staffId }, 
    order: { appliedDate: "DESC" },
    relations: ["staff"]
  });

  // Calculate leave days for each leave
  const leavesWithDays = leaves.map(leave => {
    const { startDate, endDate } = validateAndFormatDates(
      new Date(leave.fromDate), 
      new Date(leave.toDate)
    );
    
    const leaveDays = calculateLeaveDays(startDate, endDate, leave.leaveType);
    
    return {
      ...leave,
      leaveDays,
      hasDateError: leave.fromDate > leave.toDate
    };
  });

  return leavesWithDays;
};
