// lead.schema.ts
import { z } from "zod";

// Create Lead Schema
export const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  requirement: z.string().optional(),
  source_id: z.string().uuid("Invalid source ID").optional(),
  status_id: z.string().uuid("Invalid status ID").optional(),
  assigned_to: z.string().uuid("Invalid assigned_to user ID").optional(),

  followups: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});

// Update Lead Schema (all optional)
export const updateLeadSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  requirement: z.string().optional(),
  source_id: z.string().uuid("Invalid source ID").optional(),
  status_id: z.string().uuid("Invalid status ID").optional(),
  assigned_to: z.string().uuid("Invalid assigned_to user ID").optional(),

  followups: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});
