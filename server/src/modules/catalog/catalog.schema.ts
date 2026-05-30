import { z } from 'zod';

export const ListCatalogQuerySchema = z.object({
  search: z.string().optional(),
  categorySlug: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name']).default('newest'),
});

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CheckoutSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(6).max(32),
  shippingAddress: z.string().min(1).max(500),
  paymentMethod: z
    .enum(['TRANSFER', 'EWALLET', 'QRIS', 'CASH', 'OTHER'])
    .default('TRANSFER'),
  notes: z.string().max(1000).optional().nullable(),
  shippingFee: z.number().nonnegative().default(0),
  // selected courier (from RajaOngkir quote); snapshots stored on the order
  shippingCourier: z.string().max(120).optional().nullable(),
  shippingService: z.string().max(120).optional().nullable(),
  shippingEtd: z.string().max(60).optional().nullable(),
  destinationCity: z.string().max(120).optional().nullable(),
  destinationId: z.string().max(20).optional().nullable(),
  items: z.array(CheckoutItemSchema).min(1),
});

// Public order lookup/tracking requires the customer's phone as a lightweight
// ownership check (order number alone must not reveal another buyer's order).
export const OrderLookupQuerySchema = z.object({
  phone: z.string().min(4).max(32),
});

export type ListCatalogQuery = z.infer<typeof ListCatalogQuerySchema>;
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
export type OrderLookupQuery = z.infer<typeof OrderLookupQuerySchema>;
