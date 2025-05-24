// import { z } from "zod";

// // Create Attachment Schema
// export const createLeadAttachment = z.object({
//   lead_id: z.string().uuid(),
//   uploaded_by: z.string().uuid().nullable().optional(),
//   file_url: z.string().url().optional(), // for cloud storage or direct link
//   link: z.string().url().optional(),     // optional external link
// });

// // Update Attachment Schema
// export const updateLeadAttachment = z.object({
//   lead_id: z.string().uuid().optional(),
//   uploaded_by: z.string().uuid().nullable().optional(),
//   file_url: z.string().url().optional(),
//   link: z.string().url().optional(),
// });
