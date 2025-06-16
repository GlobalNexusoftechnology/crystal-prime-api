import { z } from "zod";

// Create Schema (all optional handled via .optional())
export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().min(10).max(20),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
  lead_id: z.string().uuid("Invalid lead ID").optional(),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  website: z.string().url("Invalid website URL").optional(),
});

// Update Schema (partial of create)
export const updateClientSchema = createClientSchema.partial();



