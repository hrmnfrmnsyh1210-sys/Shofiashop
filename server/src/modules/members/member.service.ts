import { prisma } from '../../lib/prisma.js';
import { badRequest, notFound } from '../../lib/httpError.js';
import type {
  CreateMemberInput,
  ListMemberQuery,
  UpdateMemberInput,
} from './member.schema.js';

export const memberService = {
  list: async (q: ListMemberQuery) => {
    const where = {
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { phone: { contains: q.search } },
              { email: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.member.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  get: async (id: string) => {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) throw notFound('Member not found');
    return member;
  },

  getByPhone: async (phone: string) => {
    const member = await prisma.member.findUnique({ where: { phone } });
    if (!member) throw notFound('Member not found');
    return member;
  },

  create: async (input: CreateMemberInput) => {
    return prisma.member.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email ?? undefined,
        address: input.address ?? undefined,
        notes: input.notes ?? undefined,
        points: input.points ?? 0,
      },
    });
  },

  update: async (id: string, input: UpdateMemberInput) => {
    await memberService.get(id);
    return prisma.member.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.points !== undefined ? { points: input.points } : {}),
      },
    });
  },

  remove: async (id: string) => {
    await memberService.get(id);
    await prisma.member.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },

  adjustPoints: async (id: string, delta: number) => {
    const member = await memberService.get(id);
    const next = member.points + delta;
    if (next < 0) throw badRequest('Resulting points cannot be negative');
    return prisma.member.update({
      where: { id },
      data: { points: next },
    });
  },
};
