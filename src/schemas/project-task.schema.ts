import { z } from "zod";

export const createTaskSchema = z.object({
  milestone_id: z.string().uuid("Invalid milestone ID"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  due_date: z.coerce.date().optional(),
  status: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional().default("Medium"),
});

export const updateTaskSchema = z.object({
  milestone_id: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  due_date: z.coerce.date().optional(),
  status: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
});
