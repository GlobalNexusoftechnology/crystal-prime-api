import { z } from 'zod';

export const eilogHeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'EI log head name is required'),
  })
}); 