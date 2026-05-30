import { z } from 'zod';

const slugSchema = z
  .string()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'slug only allows a-z, 0-9, and hyphens');

const customDomainSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, 'must be a bare hostname like toko.example.com');

const LogoUrlSchema = z
  .string()
  .max(2_000_000)
  .refine(
    (v) => v.startsWith('data:image/') || /^https?:\/\//.test(v),
    'logoUrl must be an http(s) URL or a data:image/* base64 string',
  );

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  description: z.string().max(2000).optional().nullable(),
  whatsapp: z.string().max(32).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  customDomain: customDomainSchema.optional().nullable(),
  logoUrl: LogoUrlSchema.optional().nullable(),
  bankInfo: z.string().max(1000).optional().nullable(),
  originCityId: z.string().max(20).optional().nullable(),
  originCityName: z.string().max(120).optional().nullable(),
  isActive: z.boolean().default(true),
  // optional bootstrap admin for the new tenant
  adminName: z.string().min(2).max(120).optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(8).max(128).optional(),
});

export const UpdateTenantSchema = CreateTenantSchema.partial().omit({
  adminName: true,
  adminEmail: true,
  adminPassword: true,
});

export const ListTenantQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// Admins can only edit their own store's display info (no slug/domain/active).
export const UpdateOwnTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  whatsapp: z.string().max(32).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  logoUrl: LogoUrlSchema.optional().nullable(),
  bankInfo: z.string().max(1000).optional().nullable(),
  originCityId: z.string().max(20).optional().nullable(),
  originCityName: z.string().max(120).optional().nullable(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type UpdateOwnTenantInput = z.infer<typeof UpdateOwnTenantSchema>;
export type ListTenantQuery = z.infer<typeof ListTenantQuerySchema>;
