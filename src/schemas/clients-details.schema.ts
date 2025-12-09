// src/schemas/client-details.schema.ts
import { z } from "zod";

// 🔹 Create Schema
export const CreateClientDetailsSchema = z.object({
  client_id: z.string().uuid({ message: "Invalid client ID" }),
  client_contact: z.string().min(1, "Client contact is required").max(100).optional(),
  contact_person: z.string().max(100).optional(),
  email: z.string().email("Invalid email").max(100).optional(),
  contact1: z.string().max(20).optional(),
  contact2: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
});

// 🔹 Update Schema (Without refine)
export const UpdateClientDetailsSchema = z.object({
  client_id: z.string().uuid().optional(),
  client_contact: z.string().max(100).optional(),
  contact_person: z.string().max(100).optional(),
  email: z.string().email().max(100).optional(),
  contact1: z.string().max(20).optional(),
  contact2: z.string().max(20).optional(),
  designation: z.string().max(100).optional(),
});

