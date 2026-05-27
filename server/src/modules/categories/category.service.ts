import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/httpError.js';
import {
  slugify,
  type CreateCategoryInput,
  type ListCategoryQuery,
  type UpdateCategoryInput,
} from './category.schema.js';

export const categoryService = {
  list: async (q: ListCategoryQuery) => {
    const where = {
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

  get: async (id: string) => {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw notFound('Category not found');
    return cat;
  },

  create: async (input: CreateCategoryInput) => {
    return prisma.category.create({
      data: {
        name: input.name,
        slug: input.slug ? slugify(input.slug) : slugify(input.name),
        description: input.description,
        isActive: input.isActive ?? true,
      },
    });
  },

  update: async (id: string, input: UpdateCategoryInput) => {
    await categoryService.get(id);
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

  remove: async (id: string) => {
    await categoryService.get(id);
    // Soft delete approach: keep historical product references intact.
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  },
};
