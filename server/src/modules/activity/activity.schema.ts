import { z } from 'zod';

export const ListActivityQuerySchema = z.object({
  // matches the start of the action key, e.g. "product" -> product.create/update/delete
  action: z.string().max(60).optional(),
  userId: z.string().optional(),
  search: z.string().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListActivityQuery = z.infer<typeof ListActivityQuerySchema>;
