import { z } from "zod";

export const createClientFollowupSchema = z.object({
  client_id: z.string({ required_error: "client_id is required" }).uuid("Invalid client ID"),
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
  completed_date:z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const updateClientFollowupSchema = z.object({
  client_id: z.string().uuid("Invalid client ID").optional(),
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
  completed_date:z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
});
