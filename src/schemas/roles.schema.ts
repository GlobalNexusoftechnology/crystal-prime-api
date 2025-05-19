import { z } from "zod";
import { RoleName } from "../entities/roles.entity";

export const CreateRoleSchema = z.object({
  role: z.nativeEnum(RoleName),
  permissions: z.array(z.string()).nonempty("At least one permission is required"),
});

export const UpdateRoleSchema = z.object({
  role: z.nativeEnum(RoleName).optional(),
  permissions: z.array(z.string()).optional(),
});
