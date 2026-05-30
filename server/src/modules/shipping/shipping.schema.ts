import { z } from 'zod';

export const ListCitiesQuerySchema = z.object({
  provinceId: z.string().optional(),
});

export const ShippingCostItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const ShippingCostSchema = z.object({
  destinationCityId: z.string().min(1),
  items: z.array(ShippingCostItemSchema).min(1),
});

export type ListCitiesQuery = z.infer<typeof ListCitiesQuerySchema>;
export type ShippingCostInput = z.infer<typeof ShippingCostSchema>;
