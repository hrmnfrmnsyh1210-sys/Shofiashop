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

const tenantPublic = (t: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  bankInfo: string | null;
  customDomain: string | null;
}) => ({
  id: t.id,
  name: t.name,
  slug: t.slug,
  description: t.description,
  whatsapp: t.whatsapp,
  email: t.email,
  address: t.address,
  logoUrl: t.logoUrl,
  bankInfo: t.bankInfo,
  customDomain: t.customDomain,
});

export const catalogService = {
  getStoreBySlug: async (slug: string) => {
    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });
    if (!tenant) throw notFound('Store not found');
    return tenantPublic(tenant);
  },

  getStoreByHost: async (host: string) => {
    const tenant = await prisma.tenant.findFirst({
      where: { customDomain: host, isActive: true },
    });
    if (!tenant) throw notFound('Store not found');
    return tenantPublic(tenant);
  },

  listProducts: async (tenantId: string, q: ListCatalogQuery) => {
    const where: Prisma.ProductWhereInput = {
      tenantId,
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

  getProduct: async (tenantId: string, id: string) => {
    const product = await prisma.product.findFirst({
      where: { id, tenantId, isActive: true, showOnline: true },
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

  listCategories: async (tenantId: string) => {
    return prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  },

  checkout: async (tenantId: string, input: CheckoutInput) => {
    return transactionService.create(tenantId, {
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
