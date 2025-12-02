import { object, string, TypeOf, z } from "zod";


const MAX_KEYWORDS = 8;
const MIN_KEYWORD_LENGTH = 1;
const MAX_KEYWORD_LENGTH = 40;

export const createUserSchema = object({
  body: object({
    first_name: string({
      required_error: "First name is required",
    }),

    employee_id: string().optional(),

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
      .min(6, "Password must be at least 6 characters")
      .max(32, "Password must be less than 32 characters"),

    role_id: string({
      required_error: "Role id is required",
    }),

    dob: z.coerce.date().optional(),

    team_lead_id: string().optional(),
        keywords: z
      .array(
        string()
          .trim()
          .min(MIN_KEYWORD_LENGTH, `Keyword must be at least ${MIN_KEYWORD_LENGTH} character`)
          .max(MAX_KEYWORD_LENGTH, `Keyword must be at most ${MAX_KEYWORD_LENGTH} characters`)
      )
      .max(MAX_KEYWORDS, `Maximum ${MAX_KEYWORDS} keywords allowed`)
      .optional(),
  
  }),
});

export const updateUserSchema = object({
  body: object({
    first_name: string().optional(),

    last_name: string().optional().optional(),

    employee_id: string().optional(),

    email: string().email("Invalid email address").optional(),

    phone_number: string().optional(),

    password: string()
      .min(6, "Password must be at least 6 characters")
      .max(32, "Password must be less than 32 characters").optional(),

    role_id: string().optional(),

    dob: z.coerce.date().optional(),

    team_lead_id: string().optional(),

       keywords: z
      .array(
        string()
          .trim()
          .min(MIN_KEYWORD_LENGTH, `Keyword must be at least ${MIN_KEYWORD_LENGTH} character`)
          .max(MAX_KEYWORD_LENGTH, `Keyword must be at most ${MAX_KEYWORD_LENGTH} characters`)
      )
      .max(MAX_KEYWORDS, `Maximum ${MAX_KEYWORDS} keywords allowed`)
      .optional(),
  
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

export const createClientCredentialsSchema = object({
  body: object({
    email: string({
      required_error: "Email address is required",
    }).email("Invalid email address"),

    clientId: string({
      required_error: "Client ID is required",
    }).uuid(),

    password: string({
      required_error: "Password is required",
    }).min(8, "Invalid email or password"),
  }),
});

/**
 * @schema change password
 * @description Validation schema for change password.
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string({
    required_error: 'Old Password is required',
  }),
  newPassword: z.string({
    required_error: 'Password is required',
  }).min(6, 'Password must be at least 6 characters long'),
});

export const changeClientPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string({
    required_error: 'Password is required',
  }).min(6, 'Password must be at least 6 characters long'),
});

export type CreateUserInput = TypeOf<typeof createUserSchema>["body"];
export type LoginUserInput = TypeOf<typeof loginUserSchema>["body"];
export type CreateClientCredentialsInput = TypeOf<typeof createClientCredentialsSchema>["body"];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
