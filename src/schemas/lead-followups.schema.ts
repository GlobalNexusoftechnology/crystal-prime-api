import { z } from "zod";

export const CreateLeadFollowupSchema = z.object({
  lead_id: z.string().uuid(), // or z.number() if using numeric IDs
  user_id: z.string().uuid().optional().nullable(),
  status: z.enum(["RESCHEDULE", "PENDING", "AWAITING RESPONSE", "NO RESPONSE", "FAILED", "COMPLETED"]).optional().default("PENDING"),
  due_date: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export const UpdateLeadFollowupSchema = z.object({
  lead_id: z.string().uuid().optional(), // or z.number().optional()
  user_id: z.string().uuid().optional().nullable(),
  status: z.enum(["RESCHEDULE", "PENDING", "AWAITING RESPONSE", "NO RESPONSE", "FAILED", "COMPLETED"]).optional(),
  due_date: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

