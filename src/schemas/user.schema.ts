import { object, string, TypeOf, z } from "zod";
import { RoleEnumType } from "../entities/user.entity";

// Schema for user registration
export const createUserSchema = object({
  body: object({
    name: string({
      required_error: "Name is required",
    }),
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),
    password: string({
      required_error: "Password is required",
    })
      .min(8, "Password must be more than 8 characters")
      .max(32, "Password must be less than 32 characters"),
   
    role: z.nativeEnum(RoleEnumType, {
      required_error: "Role is required",
    }),
    verificationCode: string().optional(), // Add this line here
  })
});

// Schema for user login
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

// Type definitions
export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];

export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];

