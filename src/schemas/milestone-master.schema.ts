import { z } from "zod";

export const createMilestoneMasterSchema = z.object({
  template_id: z.string().uuid("Invalid template ID"),
  name: z.string().min(1, "Milestone name is required"),
  description: z.string().optional(),
  estimated_days: z.number().int().positive().optional(),
});

export const updateMilestoneMasterSchema = z.object({
  template_id: z.string().uuid("Invalid template ID").optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  estimated_days: z.number().int().positive().optional(),
});


