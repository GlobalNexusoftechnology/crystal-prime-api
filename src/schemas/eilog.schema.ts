import { PaymentModeEnum } from '../entities';
import { TypeOf, z } from 'zod';

export const eilogSchema = z.object({
  body: z.object({
    eilogType: z.string().uuid(),
    eilogHead: z.string().uuid(),
    description: z.string().optional(),
    income: z.coerce.number().positive('Income must be greater than 0').optional(),
    expense: z.coerce.number().positive('Expense must be greater than 0').optional(),
    paymentMode: z.nativeEnum(PaymentModeEnum),
    attachment: z.string().optional(),
  })
});

export const eilogUpdateSchema = z.object({
  body: z.object({
    eilogType: z.string().uuid().optional(),
    eilogHead: z.string().uuid().optional(),
    description: z.string().optional(),
    income: z.coerce.number().positive('Income must be greater than 0').optional(),
    expense: z.coerce.number().positive('Expense must be greater than 0').optional(),    paymentMode: z.nativeEnum(PaymentModeEnum).optional(),
    attachment: z.string().optional(),
  })
});

export type EILogInput = TypeOf<typeof eilogSchema>["body"];
export type EILogUpdateInput = TypeOf<typeof eilogUpdateSchema>["body"];
