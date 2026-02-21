import { z } from "zod";

export const createInventorySchema = z.object({
  name: z.string().min(1, "Inventory name is required"),
  code: z.string().optional(),
  materialBrandId: z.string().optional(),
  size: z.string().optional(),
  uom: z.string().optional(),
  pressure: z.string().optional(),
  hsn: z.string().optional(),
  materialTypeId: z.string().optional(),
  gst: z.string().optional(),
  purchase_price: z.number().optional(),
  sales_price: z.number().optional(),
  photos: z.array(z.string()).optional(),
  active: z.boolean().optional().default(true),
  sales_description: z.string().optional(),
  purchase_description: z.string().optional(),
  alias: z.string().optional(),
  quantity: z.number().min(0).optional(),
  prices: z.number().min(0).optional(),
});

export const updateMaterialSchema = createInventorySchema.partial();
