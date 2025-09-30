import { z } from "zod";

// Schema for creating a new Daily Task Entry
export const createDailyTaskEntrySchema = z.object({
    task_id: z.string({ required_error: "Task ID is required" }),
    entry_date: z.coerce.date({ required_error: "Entry date is required" }),
    task_title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    priority: z.string().optional().default('Medium'),
});

// Schema for updating a Daily Task Entry
export const updateDailyTaskEntrySchema = z.object({
    task_title: z.string().optional(),
    description: z.string().optional(),
    entry_date: z.coerce.date().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    priority: z.string().optional(),
}).strict();

// Schema for updating status of a Daily Task Entry
export const updateDailyTaskStatusSchema = z.object({
    status: z.string({ required_error: "Status is required" }).min(1, "Status cannot be empty"),
}).strict();


