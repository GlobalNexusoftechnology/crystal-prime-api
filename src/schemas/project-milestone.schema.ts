import { z } from "zod";

export const createMilestoneSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  actual_date: z.coerce.date().optional(),
  estimated_date: z.coerce.date().optional(),
  assigned_to: z.string().optional(),
  status: z.string().min(1),
  remark: z.string().optional(),
});

export const updateMilestoneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  actual_date: z.coerce.date().optional(),
  estimated_date: z.coerce.date().optional(),
  assigned_to: z.string().optional(),
  status: z.string().optional(),
  remark: z.string().optional(),
  project_id: z.string().uuid().optional(),
});
