import { z } from 'zod';

// imageUrl accepts http(s) URLs or base64 data URLs (admin uploads).
const ImageUrlSchema = z
  .string()
  .max(2_000_000) // ~2 MB base64 cap
  .refine(
    (v) => v.startsWith('data:image/') || /^https?:\/\//.test(v),
    'imageUrl must be an http(s) URL or a data:image/* base64 string',
  );

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(64),
  barcode: z.string().max(64).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: ImageUrlSchema.optional().nullable(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(0),
  unit: z.string().max(16).default('pcs'),
  isActive: z.boolean().default(true),
  showOnline: z.boolean().default(true),
  categoryId: z.string().optional().nullable(),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ListProductQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  showOnline: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  lowStock: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['createdAt', '-createdAt', 'name', '-name', 'stock', '-stock', 'price', '-price'])
    .default('-createdAt'),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ListProductQuery = z.infer<typeof ListProductQuerySchema>;
