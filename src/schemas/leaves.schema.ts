import { z } from "zod";

export const createLeaveSchema = z.object({
  staffId: z.string(),
  appliedDate: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  leaveType: z.enum(["Half Day", "Full Day", "Sick Leave", "EL"]),
  description: z.string().optional(),
});

export const updateLeaveSchema = z.object({
  status: z.enum(["Approved", "Not Approved"]).optional(),
  adminRemark: z.string().optional(),
});

export type LeaveCreateInput = z.infer<typeof createLeaveSchema>;
export type LeaveUpdateInput = z.infer<typeof updateLeaveSchema>;
