import { z } from "zod";

// ✅ Schema for creating a new Project Template
export const createProjectTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  project_type: z.string().optional(),
  estimated_days: z.number().int().optional(),

  milestones: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        estimated_days: z.number().int().optional(),
        tasks: z
          .array(
            z.object({
              title: z.string().optional(),
              description: z.string().optional(),
              estimated_days: z.number().int().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

// ✅ Schema for updating a Project Template
export const updateProjectTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  project_type: z.string().optional(),
  estimated_days: z.number().int().optional(),

  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        estimated_days: z.number().int().optional(),

        tasks: z
          .array(
            z.object({
              id: z.string().optional(),
              title: z.string().optional(),
              description: z.string().optional(),
              estimated_days: z.number().int().optional(),
              _delete: z.boolean().optional(),
            }),
          )
          .optional(),

        _delete: z.boolean().optional(),
      }),
    )
    .optional(),
});
