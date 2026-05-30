import { z } from 'zod';

// Tenant admins can only manage these roles (never SUPER_ADMIN).
export const ManageableRole = z.enum(['ADMIN', 'MANAGER', 'CASHIER']);

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: ManageableRole.default('CASHIER'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: ManageableRole.optional(),
  isActive: z.boolean().optional(),
  // optional password reset
  password: z.string().min(8).max(128).optional(),
});

export const ListUserQuerySchema = z.object({
  search: z.string().optional(),
  role: ManageableRole.optional(),
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
