import { z } from "zod";

export const createProjectSchema = z.object({
  client_id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required"),
  project_type: z.string().optional(),
  budget: z.number().optional(),
  estimated_cost: z.number().optional(),
  actual_cost: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  actual_start_date: z.coerce.date().optional(),
  actual_end_date: z.coerce.date().optional(),
  milestones: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
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
