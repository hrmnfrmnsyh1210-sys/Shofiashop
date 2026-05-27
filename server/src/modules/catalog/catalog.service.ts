import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/httpError.js';
import { transactionService } from '../transactions/transaction.service.js';
import type { CheckoutInput, ListCatalogQuery } from './catalog.schema.js';

const orderByFor = (sort: ListCatalogQuery['sort']): Prisma.ProductOrderByWithRelationInput => {
  switch (sort) {
    case 'price-asc':
      return { price: 'asc' };
    case 'price-desc':
      return { price: 'desc' };
    case 'name':
      return { name: 'asc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
};

export const catalogService = {
  listProducts: async (q: ListCatalogQuery) => {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      showOnline: true,
      stock: { gt: 0 },
      ...(q.categorySlug
        ? { category: { slug: q.categorySlug, isActive: true } }
        : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search } },
              { description: { contains: q.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: orderByFor(q.sort),
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          imageUrl: true,
          price: true,
          unit: true,
          stock: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  getProduct: async (id: string) => {
    const product = await prisma.product.findFirst({
      where: { id, isActive: true, showOnline: true },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        imageUrl: true,
        price: true,
        unit: true,
        stock: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!product) throw notFound('Product not available');
    return product;
  },

  listCategories: async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  },

  checkout: async (input: CheckoutInput) => {
    return transactionService.create({
      channel: 'ONLINE',
      paymentMethod: input.paymentMethod,
      memberId: null,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      discount: 0,
      tax: 0,
      shippingFee: input.shippingFee,
      paymentAmount: 0,
      notes: input.notes ?? null,
      items: input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        discount: 0,
      })),
    });
  },
};
