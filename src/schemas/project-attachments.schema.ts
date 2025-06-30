import { z } from "zod";

// Create Attachment Schema
export const createProjectAttachment = z.object({
  project_id: z.string().uuid(),
  file_path: z.string().url(),
  file_type: z.string(),
  file_name: z.string()
});

// Update Attachment Schema
export const updateProjectAttachment = z.object({
  file_path: z.string().url().optional(),
  file_type: z.string().optional(),
  file_name: z.string().optional()
});
