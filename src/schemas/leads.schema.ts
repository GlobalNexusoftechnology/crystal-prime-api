// lead.schema.ts
import { z } from "zod";

// Create Lead Schema
export const createLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  phone: z.string().min(1, "Phone number is required"),
  last_name: z.string().optional(),
  company: z.string().optional(),
  other_contact: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  location: z.string().optional(),
  budget: z.union([z.string(), z.number()]).optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().optional(),
  status_id: z.string().optional(),
  type_id: z.string().optional(),
  assigned_to: z.string().optional(),
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
  email: z.string().email("Invalid email format").optional(),
  location: z.string().optional(),
  budget: z.number().optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().optional(),
  status_id: z.string().optional(),
  type_id: z.string().optional(),
  assigned_to: z.string().optional(),
  followups: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});

// Lead Upload Schema (fields expected in Excel)
export const excelLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  phone: z.string().min(1, "Phone number is required"),
  last_name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  location: z.string().optional(),
  budget: z.coerce.number().optional(),
  requirement: z.string().optional(),
  possibility_of_conversion: z.coerce.number().min(0).max(100).optional(),
  source_id: z.string().optional(),
  status_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

// Create Lead Schema
export const createMetaLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required").optional(),
  phone_number: z.string().min(1, "Phone number is required").optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  address: z.string().optional(),
  budget: z.union([z.string(), z.number()]).optional(),
  requirement: z.string().optional(),
});