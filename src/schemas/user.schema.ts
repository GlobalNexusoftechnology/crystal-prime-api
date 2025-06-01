import { object, string, TypeOf, z } from "zod";

export const createUserSchema = object({
  body: object({
    first_name: string({
      required_error: "First name is required",
    }),

    last_name: string().optional(),

    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),

    phone_number: string({
      required_error: "Phone number is required",
    }).optional(),

    password: string({
      required_error: "Password is required",
    })
      .min(8, "Password must be at least 8 characters")
      .max(32, "Password must be less than 32 characters"),

    role_id: string({
      required_error: "Role id is required",
    }),

    dob: z.coerce.date().optional(),
  }),
});

export const updateUserSchema = object({
  body: object({
    first_name: string().optional(),

    last_name: string().optional().optional(),

    email: string().email("Invalid email address").optional(),

    phone_number: string().optional(),

    password: string()
      .min(8, "Password must be at least 8 characters")
      .max(32, "Password must be less than 32 characters").optional(),

    role_id: string().optional(),

    dob: z.coerce.date().optional(),
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
