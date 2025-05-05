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
    passwordConfirm: string({
      required_error: "Please confirm your password",
    }),
    role: z.nativeEnum(RoleEnumType, {
      required_error: "Role is required",
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  }),
});

export const createEmployerSchema = object({
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
    passwordConfirm: string({
      required_error: "Please confirm your password",
    }),
    role: z.nativeEnum(RoleEnumType, {
      required_error: "Role is required",
    }),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  }),
});

// Schema for updating user details
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
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

// Schema for email verification
export const verifyEmailSchema = object({
  params: object({
    verificationCode: string({
      required_error: "Verification code is required",
    }),
  }),
});

// Type definitions
export type CreateUserInput = Omit<
  TypeOf<typeof createUserSchema>["body"],
  "passwordConfirm"
>;
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];
export type VerifyEmailInput = TypeOf<typeof verifyEmailSchema>["params"];
