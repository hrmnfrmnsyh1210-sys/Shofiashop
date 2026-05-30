import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { badRequest, notFound } from '../../lib/httpError.js';
import { transactionService } from '../transactions/transaction.service.js';
import { shippingService } from '../shipping/shipping.service.js';
import type { ShippingCostInput } from '../shipping/shipping.schema.js';
import type { CheckoutInput, ListCatalogQuery } from './catalog.schema.js';

const normalizePhone = (p: string) => p.replace(/\D/g, '');

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

  // Quote shipping options for a cart against this store's origin city.
  shippingCost: async (tenantId: string, input: ShippingCostInput) => {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { originCityId: true },
    });
    if (!tenant?.originCityId) {
      throw badRequest('Toko belum mengatur kota asal pengiriman.');
    }

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: { id: true, weight: true },
    });
    const weightMap = new Map(products.map((p) => [p.id, p.weight]));
    if (weightMap.size !== productIds.length) {
      throw badRequest('Satu atau lebih produk tidak ditemukan.');
    }

    const totalWeight = input.items.reduce(
      (sum, i) => sum + (weightMap.get(i.productId) ?? 0) * i.quantity,
      0,
    );

    return shippingService.calculateCost({
      originId: tenant.originCityId,
      destinationId: input.destinationId,
      weight: totalWeight,
    });
  },

  // Look up a buyer's own online order, verifying the phone number matches the
  // one used at checkout. Throws 404 on mismatch so order numbers can't be
  // enumerated to read other people's orders.
  findCustomerOrder: async (tenantId: string, orderNumber: string, phone: string) => {
    const trx = await prisma.transaction.findFirst({
      where: {
        tenantId,
        transactionNumber: orderNumber.trim(),
        channel: 'ONLINE',
      },
      include: {
        items: {
          select: { id: true, productName: true, quantity: true, unitPrice: true, subtotal: true },
        },
      },
    });
    const actual = normalizePhone(trx?.customerPhone ?? '');
    if (!trx || !actual || actual !== normalizePhone(phone)) {
      throw notFound('Pesanan tidak ditemukan. Periksa nomor pesanan dan no. HP Anda.');
    }
    return trx;
  },

  // Public-safe order status for the buyer (no internal/financial cost data).
  getOrderStatus: async (tenantId: string, orderNumber: string, phone: string) => {
    const trx = await catalogService.findCustomerOrder(tenantId, orderNumber, phone);
    return {
      orderNumber: trx.transactionNumber,
      status: trx.status,
      onlineStatus: trx.onlineStatus,
      createdAt: trx.createdAt,
      shippedAt: trx.shippedAt,
      customerName: trx.customerName,
      shippingAddress: trx.shippingAddress,
      subtotal: trx.subtotal,
      shippingFee: trx.shippingFee,
      total: trx.total,
      shippingCourier: trx.shippingCourier,
      shippingService: trx.shippingService,
      shippingEtd: trx.shippingEtd,
      destinationCity: trx.destinationCity,
      trackingNumber: trx.trackingNumber,
      hasTracking: Boolean(trx.trackingNumber && trx.shippingCourier),
      items: trx.items,
    };
  },

  // Live courier tracking for the buyer's own order.
  trackOrder: async (tenantId: string, orderNumber: string, phone: string) => {
    const trx = await catalogService.findCustomerOrder(tenantId, orderNumber, phone);
    if (!trx.trackingNumber) {
      throw badRequest('Pesanan ini belum dikirim / belum ada nomor resi.');
    }
    if (!trx.shippingCourier) {
      throw badRequest('Data kurir pesanan ini belum lengkap, hubungi toko.');
    }
    return shippingService.trackWaybill({
      waybill: trx.trackingNumber,
      courier: trx.shippingCourier,
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
      shippingCourier: input.shippingCourier ?? null,
      shippingService: input.shippingService ?? null,
      shippingEtd: input.shippingEtd ?? null,
      destinationCity: input.destinationCity ?? null,
      destinationId: input.destinationId ?? null,
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
