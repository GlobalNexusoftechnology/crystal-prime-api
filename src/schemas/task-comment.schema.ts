import { z } from "zod";

export const createTaskCommentSchema = z.object({
    body: z.object({
        task_id: z.string().uuid("Invalid task ID"),
        assigned_to: z.string().uuid("Invalid user ID"),
        remarks: z.string().min(1, "Remarks are required"),
    }),
});

export const updateTaskCommentSchema = z.object({
    body: z.object({
        remarks: z.string().min(1, "Remarks are required"),
    }),
});

export const getTaskCommentsSchema = z.object({
    params: z.object({
        task_id: z.string().uuid("Invalid task ID"),
    }),
}); 