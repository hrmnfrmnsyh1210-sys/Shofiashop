import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type {
  DailySalesQuery,
  ReportRange,
  TopProductsQuery,
} from './report.schema.js';

const rangeFilter = (q: ReportRange): Prisma.TransactionWhereInput =>
  q.from || q.to
    ? {
        createdAt: {
          ...(q.from ? { gte: q.from } : {}),
          ...(q.to ? { lte: q.to } : {}),
        },
      }
    : {};

const defaultRange = (q: ReportRange): { from: Date; to: Date } => {
  const to = q.to ?? new Date();
  const from =
    q.from ??
    (() => {
      const d = new Date(to);
      d.setDate(d.getDate() - 29);
      d.setHours(0, 0, 0, 0);
      return d;
    })();
  return { from, to };
};

export const reportService = {
  summary: async (q: ReportRange) => {
    const where: Prisma.TransactionWhereInput = {
      ...rangeFilter(q),
      status: 'PAID',
    };
    const agg = await prisma.transaction.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        subtotal: true,
        discount: true,
        tax: true,
        shippingFee: true,
        total: true,
      },
    });

    // Gross profit: sum over items of (unitPrice - unitCost) * quantity - discount
    const items = await prisma.transactionItem.findMany({
      where: { transaction: where },
      select: {
        quantity: true,
        unitPrice: true,
        unitCost: true,
        discount: true,
      },
    });
    let grossProfit = new Prisma.Decimal(0);
    let cogs = new Prisma.Decimal(0);
    for (const it of items) {
      const lineRev = it.unitPrice.mul(it.quantity).minus(it.discount);
      const lineCost = it.unitCost.mul(it.quantity);
      grossProfit = grossProfit.plus(lineRev.minus(lineCost));
      cogs = cogs.plus(lineCost);
    }

    return {
      transactionCount: agg._count._all,
      subtotal: agg._sum.subtotal ?? new Prisma.Decimal(0),
      discount: agg._sum.discount ?? new Prisma.Decimal(0),
      tax: agg._sum.tax ?? new Prisma.Decimal(0),
      shippingFee: agg._sum.shippingFee ?? new Prisma.Decimal(0),
      total: agg._sum.total ?? new Prisma.Decimal(0),
      cogs,
      grossProfit,
    };
  },

  topProducts: async (q: TopProductsQuery) => {
    const grouped = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: { ...rangeFilter(q), status: 'PAID' },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: q.limit,
    });
    if (grouped.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
      select: { id: true, name: true, sku: true, imageUrl: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));
    return grouped.map((g) => ({
      product: map.get(g.productId),
      quantity: g._sum.quantity ?? 0,
      revenue: g._sum.subtotal ?? new Prisma.Decimal(0),
    }));
  },

  dailySales: async (q: DailySalesQuery) => {
    const { from, to } = defaultRange(q);
    const trxs = await prisma.transaction.findMany({
      where: {
        status: 'PAID',
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true, total: true },
    });

    const buckets = new Map<string, { count: number; total: Prisma.Decimal }>();
    for (const t of trxs) {
      const d = t.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      const cur = buckets.get(key) ?? { count: 0, total: new Prisma.Decimal(0) };
      cur.count += 1;
      cur.total = cur.total.plus(t.total);
      buckets.set(key, cur);
    }

    const series: Array<{ date: string; count: number; total: Prisma.Decimal }> = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= to) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(cursor.getDate()).padStart(2, '0')}`;
      const cur = buckets.get(key) ?? { count: 0, total: new Prisma.Decimal(0) };
      series.push({ date: key, count: cur.count, total: cur.total });
      cursor.setDate(cursor.getDate() + 1);
    }
    return { from, to, series };
  },

  lowStock: async () => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { stock: 'asc' },
    });
    return products
      .filter((p) => p.stock <= p.minStock)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
      }));
  },
};
