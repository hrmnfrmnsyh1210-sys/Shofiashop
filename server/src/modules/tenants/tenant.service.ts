import type { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { conflict, notFound } from '../../lib/httpError.js';
import { env } from '../../config/env.js';
import type {
  CreateTenantInput,
  ListTenantQuery,
  UpdateOwnTenantInput,
  UpdateTenantInput,
} from './tenant.schema.js';

// Optional tenant fields that may appear in create/update payloads. Builds a
// Prisma data patch that only includes keys actually present in the input
// (so callers never clobber a column they didn't intend to touch).
const OPTIONAL_TENANT_FIELDS = [
  'name',
  'slug',
  'description',
  'whatsapp',
  'email',
  'address',
  'customDomain',
  'logoUrl',
  'bankInfo',
  'originCityId',
  'originCityName',
  'originProvince',
  'originCity',
  'originDistrict',
  'originSubdistrict',
  'originZipCode',
  'senderName',
  'senderPhone',
  'isActive',
] as const;

const buildTenantPatch = (input: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  for (const key of OPTIONAL_TENANT_FIELDS) {
    if (input[key] !== undefined) data[key] = input[key];
  }
  return data;
};

export const tenantService = {
  list: async (q: ListTenantQuery) => {
    const where: Prisma.TenantWhereInput = {
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { slug: { contains: q.search } },
              { customDomain: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, products: true } } },
      }),
      prisma.tenant.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  get: async (id: string) => {
    const t = await prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true, products: true } } },
    });
    if (!t) throw notFound('Tenant not found');
    return t;
  },

  create: async (input: CreateTenantInput) => {
    const existing = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existing) throw conflict('Slug already taken');
    if (input.customDomain) {
      const dom = await prisma.tenant.findUnique({
        where: { customDomain: input.customDomain },
      });
      if (dom) throw conflict('Domain already in use by another store');
    }
    if (input.adminEmail) {
      const adminExists = await prisma.user.findUnique({
        where: { email: input.adminEmail },
      });
      if (adminExists) throw conflict('Admin email already registered');
    }

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          ...buildTenantPatch(input),
          name: input.name,
          slug: input.slug,
          isActive: input.isActive,
        },
      });
      if (input.adminEmail && input.adminPassword && input.adminName) {
        await tx.user.create({
          data: {
            tenantId: tenant.id,
            name: input.adminName,
            email: input.adminEmail,
            role: 'ADMIN',
            passwordHash: await bcrypt.hash(input.adminPassword, env.BCRYPT_ROUNDS),
          },
        });
      }
      return tenant;
    });
  },

  update: async (id: string, input: UpdateTenantInput) => {
    await tenantService.get(id);
    if (input.slug) {
      const other = await prisma.tenant.findUnique({ where: { slug: input.slug } });
      if (other && other.id !== id) throw conflict('Slug already taken');
    }
    if (input.customDomain) {
      const other = await prisma.tenant.findUnique({
        where: { customDomain: input.customDomain },
      });
      if (other && other.id !== id) throw conflict('Domain already in use');
    }
    return prisma.tenant.update({
      where: { id },
      data: buildTenantPatch(input),
    });
  },

  remove: async (id: string) => {
    await tenantService.get(id);
    await prisma.tenant.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },

  // Admin's own tenant (restricted set of fields)
  getOwn: async (tenantId: string) => {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!t) throw notFound('Tenant not found');
    return t;
  },

  updateOwn: async (tenantId: string, input: UpdateOwnTenantInput) => {
    await tenantService.getOwn(tenantId);
    return prisma.tenant.update({
      where: { id: tenantId },
      data: buildTenantPatch(input),
    });
  },
};
