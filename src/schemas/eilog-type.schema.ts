import { z } from 'zod';

export const eilogTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'EI log type name is required'),
  })
});