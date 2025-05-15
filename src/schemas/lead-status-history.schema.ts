import { z } from "zod";

// Create Schema
export const createLeadStatusHistorySchema = z.object({
  lead_id: z.string({ required_error: "lead_id is required" }),
  status_id: z.string({ required_error: "status_id is required" }).nullable(), // because it's nullable in the entity
  changed_by: z.string().nullable(),
  status_remarks: z.string().nullable().optional(),
});

// Update Schema
export const updateLeadStatusHistorySchema = z.object({
  lead_id: z.string().optional(),
  status_id: z.string().nullable().optional(),
  changed_by: z.string().optional().nullable(),
  status_remarks: z.string().nullable().optional(),
});

