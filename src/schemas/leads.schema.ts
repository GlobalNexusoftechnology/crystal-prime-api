// lead.schema.ts
import { z } from "zod";

// Create Lead Schema
export const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  other_contact: z.string().optional(),
  email: z.array(z.string().email("Invalid email format")).optional(),
  location: z.string().optional(),
  budget: z.string().optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().uuid("Invalid source ID").optional(),
  status_id: z.string().uuid("Invalid status ID").optional(),
  type_id: z.string().uuid("Invalid type ID").optional(),
  assigned_to: z.string().uuid("Invalid assigned_to user ID").optional(),
  followups: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});

// Update Lead Schema (all optional)
export const updateLeadSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  other_contact: z.string().optional(),
  email: z.array(z.string().email("Invalid email format")).optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().uuid("Invalid source ID").optional(),
  status_id: z.string().uuid("Invalid status ID").optional(),
  type_id: z.string().uuid("Invalid type ID").optional(),
  assigned_to: z.string().uuid("Invalid assigned_to user ID").optional(),
  followups: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});

// Lead Upload Schema (fields expected in Excel)
export const excelLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.array(z.string().email("Invalid email format")).optional(),
  location: z.string().optional(),
  budget: z.coerce.number().optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().uuid("Invalid source ID").optional(),
  status_id: z.string().uuid("Invalid status ID").optional(),
  assigned_to: z.string().uuid("Invalid assigned user ID").optional(),
});

// Create Lead Schema
export const createMetaLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  company: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.array(z.string()).optional(),
  address: z.string().optional(),
  budget: z.string().optional(),
  requirement: z.string().optional(),
});