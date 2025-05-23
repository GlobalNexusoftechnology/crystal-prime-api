import { z } from "zod";

export const createStaffSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  contact: z.string().min(10).max(15),
  dob: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date of birth",
  }),
  role_name: z.string().min(1, "Role is required"),
});

export const updateStaffSchema = createStaffSchema.partial();
