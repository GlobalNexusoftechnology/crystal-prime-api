import { z } from "zod";

export const createLeadAttachment = z.object({
  lead_id: z.string().uuid(),
  uploaded_by: z.string().uuid().nullable().optional(),
  file_path: z.string().url(),
  file_type: z.string(),
});

export const updateLeadAttachment = z.object({
  file_path: z.string().url().optional(),
  file_type: z.string().min(1).optional(),
});
