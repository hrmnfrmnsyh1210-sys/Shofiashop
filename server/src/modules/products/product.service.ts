import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/httpError.js';
import type {
  CreateProductInput,
  ListProductQuery,
  UpdateProductInput,
} from './product.schema.js';

const parseSort = (sort: ListProductQuery['sort']): Prisma.ProductOrderByWithRelationInput => {
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? 'desc' : 'asc' } as Prisma.ProductOrderByWithRelationInput;
};

export const productService = {
  list: async (tenantId: string, q: ListProductQuery) => {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      ...(q.isActive !== undefined ? { isActive: q.isActive } : {}),
      ...(q.showOnline !== undefined ? { showOnline: q.showOnline } : {}),
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { sku: { contains: q.search } },
              { barcode: { contains: q.search } },
            ],
          }
        : {}),
    };

    const baseFindArgs: Prisma.ProductFindManyArgs = {
      where,
      orderBy: parseSort(q.sort),
      include: { category: true },
    };

    if (q.lowStock) {
      const allItems = await prisma.product.findMany(baseFindArgs);
      const filtered = allItems.filter((p) => p.stock <= p.minStock);
      const start = (q.page - 1) * q.pageSize;
      return {
        items: filtered.slice(start, start + q.pageSize),
        total: filtered.length,
        page: q.page,
        pageSize: q.pageSize,
      };
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        ...baseFindArgs,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  get: async (tenantId: string, id: string) => {
    const product = await prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!product) throw notFound('Product not found');
    return product;
  },

  getByBarcode: async (tenantId: string, barcode: string) => {
    const product = await prisma.product.findFirst({
      where: { tenantId, barcode },
      include: { category: true },
    });
    if (!product) throw notFound('Product not found');
    return product;
  },

  create: async (tenantId: string, input: CreateProductInput) => {
    return prisma.product.create({
      data: {
        tenantId,
        name: input.name,
        sku: input.sku,
        barcode: input.barcode ?? undefined,
        description: input.description ?? undefined,
        imageUrl: input.imageUrl ?? undefined,
        price: new Prisma.Decimal(input.price),
        costPrice: new Prisma.Decimal(input.costPrice),
        stock: input.stock,
        minStock: input.minStock,
        unit: input.unit,
        isActive: input.isActive,
        showOnline: input.showOnline,
        categoryId: input.categoryId ?? undefined,
      },
      include: { category: true },
    });
  },

  update: async (tenantId: string, id: string, input: UpdateProductInput) => {
    await productService.get(tenantId, id);
    return prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
        ...(input.costPrice !== undefined
          ? { costPrice: new Prisma.Decimal(input.costPrice) }
          : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.showOnline !== undefined ? { showOnline: input.showOnline } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      },
      include: { category: true },
    });
  },

  remove: async (tenantId: string, id: string) => {
    await productService.get(tenantId, id);
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  },
};
