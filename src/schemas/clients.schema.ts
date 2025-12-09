import { z } from "zod";

// Create Schema (all optional handled via .optional())
export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
  lead_id: z.string().uuid("Invalid lead ID").optional(),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  gst_number: z.string().max(20).optional(),
  website: z.string().optional(),
  client_details: z.array(
    z.object({
      client_contact: z.string().min(1, "Contact is required"),
      contact_person: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      other_contact: z.string().optional(),
      designation: z.string().optional(),
    })
  ).optional(),
});

// Update Schema (partial of create)
export const updateClientSchema = createClientSchema.partial().extend({
  client_details: z.array(
    z.object({
      id: z.string().optional(), // for updating existing details
      client_contact: z.string().min(1, "Contact is required").optional(),
      contact_person: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      other_contact: z.string().optional(),
      designation: z.string().optional(),
      _delete: z.boolean().optional(), // flag to delete detail
    })
  ).optional(),
});



