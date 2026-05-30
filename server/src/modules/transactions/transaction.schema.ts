import { z } from 'zod';

export const TransactionItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  // optional manual price override; otherwise uses product price
  unitPrice: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().default(0),
});

export const CreateTransactionSchema = z.object({
  channel: z.enum(['POS', 'ONLINE']).default('POS'),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'TRANSFER', 'EWALLET', 'QRIS', 'OTHER'])
    .default('CASH'),
  memberId: z.string().optional().nullable(),
  customerName: z.string().max(120).optional().nullable(),
  customerPhone: z.string().max(32).optional().nullable(),
  shippingAddress: z.string().max(500).optional().nullable(),
  shippingCourier: z.string().max(120).optional().nullable(),
  shippingService: z.string().max(120).optional().nullable(),
  shippingEtd: z.string().max(60).optional().nullable(),
  destinationCity: z.string().max(120).optional().nullable(),
  destinationId: z.string().max(20).optional().nullable(),
  discount: z.number().nonnegative().default(0), // header-level discount
  tax: z.number().nonnegative().default(0),
  shippingFee: z.number().nonnegative().default(0),
  paymentAmount: z.number().nonnegative().default(0),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(TransactionItemSchema).min(1),
});

export const ListTransactionQuerySchema = z.object({
  search: z.string().optional(),
  channel: z.enum(['POS', 'ONLINE']).optional(),
  status: z.enum(['PENDING', 'PAID', 'VOIDED', 'REFUNDED']).optional(),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'TRANSFER', 'EWALLET', 'QRIS', 'OTHER'])
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  cashierId: z.string().optional(),
  memberId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const UpdateOnlineStatusSchema = z.object({
  onlineStatus: z.enum([
    'NEW',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
  ]),
});

// Set / update the shipment tracking (resi) for an online order. Saving a resi
// also moves the order to SHIPPED. The courier can be overridden here in case
// it wasn't captured at checkout.
export const UpdateTrackingSchema = z.object({
  trackingNumber: z.string().min(3).max(60),
  shippingCourier: z.string().max(120).optional().nullable(),
  shippingService: z.string().max(120).optional().nullable(),
});

// Create an automatic shipment (Komship) and generate the resi. All fields are
// optional; pickup date defaults to today and time/vehicle fall back to env.
export const CreateShipmentSchema = z.object({
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'pickupDate must be YYYY-MM-DD')
    .optional(),
  pickupTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'pickupTime must be HH:MM')
    .optional(),
  pickupVehicle: z.enum(['Motor', 'Mobil', 'Truk']).optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type ListTransactionQuery = z.infer<typeof ListTransactionQuerySchema>;
export type UpdateOnlineStatusInput = z.infer<typeof UpdateOnlineStatusSchema>;
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingSchema>;
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
