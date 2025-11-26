import { z } from "zod";

export const createMaterialSchema = z.object({
  name: z.string().min(1, "Material name is required"),
  code: z.string().min(1, "Code is required"),
  materialBrandId: z.string().uuid().optional(),
  size: z.string().optional(),
  uom: z.string().optional(),
  pressure: z.string().optional(),
  hsn: z.string().optional(),
  materialTypeId: z.string().uuid().optional(),
  gst: z.string().optional(),
  purchase_price: z.number().optional(),
  sales_price: z.number().optional(),
  photos: z.array(z.string()).optional(),
  active: z.boolean().optional().default(true),
  sales_description: z.string().optional(),
  purchase_description: z.string().optional(),
  alias: z.string().optional(),
  quantity: z.number().min(0).optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial(); 