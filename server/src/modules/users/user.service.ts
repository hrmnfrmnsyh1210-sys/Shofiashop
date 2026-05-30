import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import type {
  CreateUserInput,
  ListUserQuery,
  UpdateUserInput,
} from './user.schema.js';

const sanitize = (u: {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  tenantId: u.tenantId,
  isActive: u.isActive,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export const userService = {
  list: async (tenantId: string, q: ListUserQuery) => {
    const where: Prisma.UserWhereInput = {
      tenantId,
      ...(q.role ? { role: q.role } : {}),
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { email: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    return { items: rows.map(sanitize), total, page: q.page, pageSize: q.pageSize };
  },

  get: async (tenantId: string, id: string) => {
    const user = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw notFound('Pengguna tidak ditemukan');
    return sanitize(user);
  },

  create: async (tenantId: string, input: CreateUserInput) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw conflict('Email sudah terdaftar');
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(input.password),
      },
    });
    return sanitize(user);
  },

  update: async (
    tenantId: string,
    id: string,
    input: UpdateUserInput,
    actorId: string,
  ) => {
    const target = await prisma.user.findFirst({ where: { id, tenantId } });
    if (!target) throw notFound('Pengguna tidak ditemukan');
    if (target.role === 'SUPER_ADMIN') throw badRequest('Tidak dapat mengubah super admin');

    // Guard against an admin locking themselves out.
    if (id === actorId) {
      if (input.isActive === false) throw badRequest('Tidak dapat menonaktifkan akun sendiri');
      if (input.role && input.role !== target.role)
        throw badRequest('Tidak dapat mengubah role akun sendiri');
    }

    const data: Prisma.UserUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    };

    // Revoke active sessions when deactivated or password reset.
    if (input.isActive === false || input.password) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const user = await prisma.user.update({ where: { id }, data });
    return sanitize(user);
  },
};
