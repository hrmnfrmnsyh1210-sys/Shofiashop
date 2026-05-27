import { z } from 'zod';

export const ReportRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const TopProductsQuerySchema = ReportRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const DailySalesQuerySchema = ReportRangeSchema.extend({
  // bucket size — only "day" supported for now
  granularity: z.enum(['day']).default('day'),
});

export type ReportRange = z.infer<typeof ReportRangeSchema>;
export type TopProductsQuery = z.infer<typeof TopProductsQuerySchema>;
export type DailySalesQuery = z.infer<typeof DailySalesQuerySchema>;
