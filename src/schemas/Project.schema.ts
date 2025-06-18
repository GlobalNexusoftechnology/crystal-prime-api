import { z } from "zod";

export const createProjectSchema = z.object({
  client_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required"),
  project_type: z.string().optional(),
  budget: z.number().optional(),
  estimated_cost: z.number().optional(),
  actual_cost: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  actual_start_date: z.coerce.date().optional(),
  actual_end_date: z.coerce.date().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
