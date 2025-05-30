import { z } from "zod";

//  Schema for creating a new Lead Source
export const createLeadTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// Schema for updating a Lead Source (optional fields)
export const updateLeadTypeSchema = z.object({
  name: z.string().min(1).optional(),
});
