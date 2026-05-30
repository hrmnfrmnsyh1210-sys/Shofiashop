import { z } from 'zod';

export const SearchDestinationQuerySchema = z.object({
  search: z.string().min(2).max(120),
});

export const ShippingCostItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const ShippingCostSchema = z.object({
  destinationId: z.string().min(1),
  items: z.array(ShippingCostItemSchema).min(1),
});

export type SearchDestinationQuery = z.infer<typeof SearchDestinationQuerySchema>;
export type ShippingCostInput = z.infer<typeof ShippingCostSchema>;
