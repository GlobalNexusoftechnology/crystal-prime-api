import { z } from "zod";

//  Schema for creating a new Lead Source
export const createLeadSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

// Schema for updating a Lead Source (optional fields)
export const updateLeadSourceSchema = z.object({
  name: z.string().min(1).optional(),
});
