import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { hashPassword } from '../../lib/password.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import type {
  CreateUserInput,
  ListUserQuery,
  UpdateUserInput,
} from './user.schema.js';

type UserWithTenant = Prisma.UserGetPayload<{
  include: { tenant: { select: { id: true; name: true; slug: true } } };
}>;

const sanitize = (u: UserWithTenant) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  tenantId: u.tenantId,
  tenantName: u.tenant?.name ?? null,
  isActive: u.isActive,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

const tenantInclude = {
  tenant: { select: { id: true, name: true, slug: true } },
} as const;

/** A non-super role must belong to a tenant. */
const resolveTenantId = (role: UserRole, tenantId?: string | null): string | null => {
  if (role === 'SUPER_ADMIN') return null;
  if (!tenantId) throw badRequest('Toko wajib dipilih untuk role ini');
  return tenantId;
};

export const userService = {
  list: async (q: ListUserQuery) => {
    const where: Prisma.UserWhereInput = {
      ...(q.tenantId ? { tenantId: q.tenantId } : {}),
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
        include: tenantInclude,
      }),
      prisma.user.count({ where }),
    ]);
    return { items: rows.map(sanitize), total, page: q.page, pageSize: q.pageSize };
  },

  get: async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id }, include: tenantInclude });
    if (!user) throw notFound('Pengguna tidak ditemukan');
    return sanitize(user);
  },

  create: async (input: CreateUserInput) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw conflict('Email sudah terdaftar');

    const tenantId = resolveTenantId(input.role, input.tenantId);
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw notFound('Toko tidak ditemukan');
    }

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(input.password),
      },
      include: tenantInclude,
    });
    return sanitize(user);
  },

  update: async (id: string, input: UpdateUserInput, actorId: string) => {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw notFound('Pengguna tidak ditemukan');

    // Guard against the acting super admin locking themselves out.
    if (id === actorId) {
      if (input.isActive === false) throw badRequest('Tidak dapat menonaktifkan akun sendiri');
      if (input.role && input.role !== target.role)
        throw badRequest('Tidak dapat mengubah role akun sendiri');
    }

    const nextRole = input.role ?? target.role;
    // If role/tenant change touches tenant scoping, re-validate.
    const data: Prisma.UserUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    };

    if (input.role !== undefined || input.tenantId !== undefined) {
      const tenantId = resolveTenantId(
        nextRole,
        input.tenantId !== undefined ? input.tenantId : target.tenantId,
      );
      if (tenantId) {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw notFound('Toko tidak ditemukan');
        data.tenant = { connect: { id: tenantId } };
      } else {
        data.tenant = { disconnect: true };
      }
    }

    // Revoke active sessions when deactivated or password reset.
    if (input.isActive === false || input.password) {
      await prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: tenantInclude,
    });
    return sanitize(user);
  },
};
