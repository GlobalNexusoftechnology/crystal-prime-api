import { z } from "zod";

// Schema for creating a new Daily Task Entry
export const createDailyTaskEntrySchema = z.object({
    project_id: z.string({ required_error: "Project ID is required" }),
    assigned_to: z.string({ required_error: "Assigned To is required" }),
    task_title: z.string().min(1, "Task title is required"),
    entry_date: z.coerce.date({ required_error: "Entry date is required" }),
    description: z.string().optional(),
    hours_spent: z.number().positive("Must be a positive number").optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    priority: z.string().optional().default('Medium'),
});

// Schema for updating a Daily Task Entry
export const updateDailyTaskEntrySchema = z.object({
    project_id: z.string().optional(),
    assigned_to: z.string().optional(),
    task_title: z.string().min(1).optional(),
    description: z.string().optional(),
    entry_date: z.coerce.date().optional(),
    hours_spent: z.number().positive().optional(),
    status: z.string().optional(),
    remarks: z.string().optional(),
    priority: z.string().optional(),
});


