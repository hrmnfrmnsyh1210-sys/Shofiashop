import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/httpError.js';
import {
  slugify,
  type CreateCategoryInput,
  type ListCategoryQuery,
  type UpdateCategoryInput,
} from './category.schema.js';

export const categoryService = {
  list: async (tenantId: string, q: ListCategoryQuery) => {
    const where: Prisma.CategoryWhereInput = {
      tenantId,
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { slug: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { name: 'asc' },
      }),
      prisma.category.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  get: async (tenantId: string, id: string) => {
    const cat = await prisma.category.findFirst({ where: { id, tenantId } });
    if (!cat) throw notFound('Category not found');
    return cat;
  },

  create: async (tenantId: string, input: CreateCategoryInput) => {
    return prisma.category.create({
      data: {
        tenantId,
        name: input.name,
        slug: input.slug ? slugify(input.slug) : slugify(input.name),
        description: input.description,
        isActive: input.isActive ?? true,
      },
    });
  },

  update: async (tenantId: string, id: string, input: UpdateCategoryInput) => {
    await categoryService.get(tenantId, id);
    return prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  },

  remove: async (tenantId: string, id: string) => {
    await categoryService.get(tenantId, id);
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  },
};
