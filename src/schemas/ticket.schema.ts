import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Ticket title is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().uuid("Invalid project ID"),
  milestone_id: z.string().uuid("Invalid milestone ID").optional(),
  assigned_to: z.string().optional(),
  image_url: z.string().optional(),
  // remark: z.string().optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  assigned_to: z.string().optional(),
  image_url: z.string().optional(),
  // remark: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});
