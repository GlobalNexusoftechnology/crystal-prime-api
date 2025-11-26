import { z } from 'zod';

export const materialBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Material brand name is required'),
  })
});
