import { z } from "zod";

//  Schema for creating a new Lead Source
export const createLeadStatusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  leads: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});

// Schema for updating a Lead Source (optional fields)
export const updateLeadStatusSchema = z.object({
  name: z.string().min(1).optional(),
  leads: z.array(z.any()).optional(),
  status_histories: z.array(z.any()).optional(),
});
