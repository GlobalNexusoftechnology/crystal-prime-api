import { z } from "zod";

// Create Attachment Schema
export const createLeadAttachment = z.object({
  lead_id: z.string().uuid(),
  file_path: z.string().url(),
  file_type: z.string(),
  file_name: z.string()
});
