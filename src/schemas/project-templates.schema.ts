import { z } from "zod";

// ✅ Schema for creating a new Project Template
export const createProjectTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  project_type: z.string().optional(),
  estimated_days: z.number().int().positive().optional(),
});

// ✅ Schema for updating a Project Template
export const updateProjectTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  project_type: z.string().optional(),
  estimated_days: z.number().int().positive().optional(),
});
