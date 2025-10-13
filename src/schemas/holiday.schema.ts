import { z } from "zod";

/** Create Holiday Schema */
export const createHolidaySchema = z.object({
  holidayName: z.string().min(1, "Holiday name is required"),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid date format (expected YYYY-MM-DD)"
  ),
});

/** Update Holiday Schema */
export const updateHolidaySchema = z.object({
  holidayName: z.string().optional(),
  date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    "Invalid date format (expected YYYY-MM-DD)"
  ).optional(),
});

export type HolidayCreateInput = z.infer<typeof createHolidaySchema>;
export type HolidayUpdateInput = z.infer<typeof updateHolidaySchema>;
