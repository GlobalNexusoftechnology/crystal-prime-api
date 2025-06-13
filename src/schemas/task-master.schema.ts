import { z } from "zod";

export const createProjectTaskMasterSchema = z.object({
  milestone_master_id: z.string().uuid("Invalid milestone ID"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  estimated_days: z.number().int().positive().optional()
});

export const updateProjectTaskMasterSchema = z.object({
  milestone_master_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  estimated_days: z.number().int().positive().optional()
});
