import { z } from "zod";

export const createInventoryHistory = z.object({
  material_id: z.string({
    required_error: "Material id is required",
    invalid_type_error: "Material id must be a string",
  }),
  date: z
    .string({
      required_error: "Date is required",
      invalid_type_error: "Date must be a string",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
  used: z
    .number({
      required_error: "Used quantity is required",
      invalid_type_error: "Used must be a number",
    })
    .min(0, "Used cannot be negative"),
  notes: z.string().optional(),
});

export const updateInventoryHistory = z.object({
  material_id: z.string().optional(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  used: z.number().min(0, "Used cannot be negative").optional(),
  notes: z.string().optional(),
});
