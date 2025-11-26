import { z } from 'zod';

export const materialTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Material type name is required'),
  })
});
