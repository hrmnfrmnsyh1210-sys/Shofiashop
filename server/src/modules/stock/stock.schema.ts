import { z } from 'zod';

export const StockAdjustmentSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  // For IN/OUT this is the delta. For ADJUSTMENT this is the absolute target stock.
  quantity: z.number().int(),
  reference: z.string().max(100).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export const ListStockMovementQuerySchema = z.object({
  productId: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type ListStockMovementQuery = z.infer<typeof ListStockMovementQuerySchema>;
