import { z } from "zod";

export const createProjectFollowupSchema = z.object({
  project_id: z.string({ required_error: "project_id is required" }).uuid("Invalid project ID"),
  user_id: z.string().uuid("Invalid user ID").optional().nullable(),
  status: z.enum([
    "RESCHEDULE",
    "PENDING",
    "AWAITING RESPONSE",
    "NO RESPONSE",
    "FAILED",
    "COMPLETED",
  ]).optional().default("PENDING"),
  due_date: z.coerce.date().optional().nullable(),
  completed_date: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const updateProjectFollowupSchema = z.object({
  project_id: z.string().uuid("Invalid project ID").optional(),
  user_id: z.string().uuid("Invalid user ID").optional().nullable(),
  status: z.enum([
    "RESCHEDULE",
    "PENDING",
    "AWAITING RESPONSE",
    "NO RESPONSE",
    "FAILED",
    "COMPLETED",
  ]).optional(),
  due_date: z.coerce.date().optional().nullable(),
  completed_date: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
}); 