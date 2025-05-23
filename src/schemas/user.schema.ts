import { object, string, number, date, TypeOf, z } from "zod";
import { RoleEnumType } from "../entities/user.entity";

export const createUserSchema = object({
  body: object({
    first_name: string({
      required_error: "First name is required",
    }),

    last_name: string().optional(),

    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),

    number: string({
      required_error: "Phone number is required",
    }).optional(),

    password: string({
      required_error: "Password is required",
    })
      .min(8, "Password must be at least 8 characters")
      .max(32, "Password must be less than 32 characters"),

    role: z.nativeEnum(RoleEnumType, {
      required_error: "Role is required",
    }),

    role_id: number().optional(),

    dob: z.coerce.date().optional(), // parses string to Date

    verificationCode: string().optional(),
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),

    password: string({
      required_error: "Password is required",
    }).min(8, "Invalid email or password"),
  }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];
export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];


