import { z } from "zod";

export const createTicketCommentSchema = z.object({
    body: z.object({
        ticket_id: z.string().uuid("Invalid ticket ID"),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        remark: z.string().optional(),
    }),
});

export const updateTicketCommentSchema = z.object({
    body: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        remark: z.string().optional(),
    }),
});

export const getTicketCommentsSchema = z.object({
    params: z.object({
        ticket_id: z.string().uuid("Invalid ticket ID"),
    }),
});
