import { z } from "zod";

export const CreateRoleSchema = z.object({
  role: z.string().min(1, "Role name is required"),
  permissions: z.array(z.string()).nonempty("At least one permission is required"),
});

export const UpdateRoleSchema = z.object({
  role: z.string().min(1).optional(),
  permissions: z.array(z.string()).optional(),
});