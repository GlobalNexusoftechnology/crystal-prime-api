// src/schemas/task.schema.ts
import { z } from "zod";
import { TaskPriority, TaskStatus } from "../entities/task-management.entity";

// Schema for creating a new task
export const CreateTaskSchema = z.object({
    taskName: z.string().min(1, "Task name is required"),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM), 
    endDate: z.string().datetime("Invalid date format for end date"), 
    assignedToId: z.string().uuid("Invalid UUID format for assigned user ID").optional(), 
    status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN), 
    projectId: z.string().uuid("Invalid UUID format for project ID").optional(), 
    description: z.string().optional(),
});

// Schema for updating an existing task
export const UpdateTaskSchema = z.object({
    taskName: z.string().min(1, "Task name cannot be empty").optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    endDate: z.string().datetime("Invalid date format for end date").optional(),
    assignedToId: z.string().uuid("Invalid UUID format for assigned user ID").optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    projectId: z.string().uuid("Invalid UUID format for project ID").optional().nullable(), 
    description: z.string().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update."
);

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;