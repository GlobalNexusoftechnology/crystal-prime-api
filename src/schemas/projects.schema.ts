import { z } from "zod";

export const createProjectSchema = z.object({
  client_id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  project_type: z.string().optional(),
  budget: z.number().optional(),
  estimated_cost: z.number().optional(),
  actual_cost: z.number().optional(),
  cost_of_labour: z.number().optional(),
  overhead_cost: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  actual_start_date: z.coerce.date().optional(),
  actual_end_date: z.coerce.date().optional(),
  template_id: z.string().uuid('Invalid template ID').optional().nullable(),
  renewal_type: z.enum(["NONE", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional().nullable(),
  renewal_date: z.coerce.date().optional(),
  is_renewal: z.boolean().optional(),
  milestones: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
      description: z.string().optional(),
      start_date: z.coerce.date().optional(),
      end_date: z.coerce.date().optional(),
      actual_date: z.coerce.date().optional(),
      estimated_date: z.coerce.date().optional(),
      assigned_to: z.string().optional(),
      status: z.string(),
      remark: z.string().optional(),
      tasks: z.array(
        z.object({
          id: z.string().uuid().optional(),
          title: z.string(),
          description: z.string().optional(),
          due_date: z.coerce.date().optional(),
          status: z.string().optional(),
          assigned_to: z.string().optional(),
        })
      ).optional(),
    })
  ).optional(),
  attachments: z.array(
    z.object({
      id: z.string().uuid().optional(),
      file_path: z.string(),
      file_type: z.string(),
      file_name: z.string(),
      uploaded_by: z.string().optional(),
    })
  ).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
