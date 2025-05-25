import { string, z } from "zod";

export const CreateRoleSchema = z.object({
  role: string({
      required_error: "role is required",
    }),
  permissions: z.array(z.string()).nonempty("At least one permission is required"),
});

export const UpdateRoleSchema = z.object({
  role: string().optional(),
  permissions: z.array(z.string()).optional(),
});
