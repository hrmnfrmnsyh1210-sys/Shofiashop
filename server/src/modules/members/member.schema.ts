import { z } from 'zod';

export const CreateMemberSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(6).max(32),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  points: z.number().int().nonnegative().optional(),
});

export const UpdateMemberSchema = CreateMemberSchema.partial();

export const ListMemberQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdjustPointsSchema = z.object({
  delta: z.number().int(), // can be negative
  reason: z.string().max(200).optional(),
});

export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;
export type ListMemberQuery = z.infer<typeof ListMemberQuerySchema>;
