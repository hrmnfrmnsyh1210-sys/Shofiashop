import { z } from 'zod';

// SUPER_ADMIN manages users across every tenant and may create any role.
export const AnyRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']);

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: AnyRole.default('CASHIER'),
  // required for non-super roles; ignored for SUPER_ADMIN
  tenantId: z.string().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: AnyRole.optional(),
  isActive: z.boolean().optional(),
  tenantId: z.string().optional().nullable(),
  // optional password reset
  password: z.string().min(8).max(128).optional(),
});

export const ListUserQuerySchema = z.object({
  search: z.string().optional(),
  role: AnyRole.optional(),
  tenantId: z.string().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ListUserQuery = z.infer<typeof ListUserQuerySchema>;
