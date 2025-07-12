import { z } from 'zod';

export const eilogHeadSchema = z.object({
  body: z.object({
    EIHead: z.string().min(1, 'EIHead is required'),
  })
}); 