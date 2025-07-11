import { z } from 'zod';

export const eilogTypeSchema = z.object({
  body: z.object({
    EIType: z.string().min(1, 'EIType is required'),
  })
});