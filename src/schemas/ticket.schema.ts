import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Ticket title is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().uuid("Invalid project ID"),
  task_id: z.string().uuid("Invalid task ID").optional(),
  image_url: z.string().optional(),
  remark: z.string().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  image_url: z.string().optional(),
  remark: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});
