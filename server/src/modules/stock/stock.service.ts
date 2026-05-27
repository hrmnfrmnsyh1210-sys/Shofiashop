import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { badRequest, notFound } from '../../lib/httpError.js';
import type {
  ListStockMovementQuery,
  StockAdjustmentInput,
} from './stock.schema.js';

export const stockService = {
  listMovements: async (q: ListStockMovementQuery) => {
    const where: Prisma.StockMovementWhereInput = {
      ...(q.productId ? { productId: q.productId } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: q.from } : {}),
              ...(q.to ? { lte: q.to } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  adjust: async (input: StockAdjustmentInput, userId?: string) => {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) throw notFound('Product not found');

    const stockBefore = product.stock;
    let stockAfter: number;
    let movementQty: number;

    if (input.type === 'IN') {
      if (input.quantity <= 0) throw badRequest('IN quantity must be positive');
      stockAfter = stockBefore + input.quantity;
      movementQty = input.quantity;
    } else if (input.type === 'OUT') {
      if (input.quantity <= 0) throw badRequest('OUT quantity must be positive');
      if (stockBefore < input.quantity) throw badRequest('Insufficient stock');
      stockAfter = stockBefore - input.quantity;
      movementQty = input.quantity;
    } else {
      // ADJUSTMENT — absolute target stock
      if (input.quantity < 0) throw badRequest('ADJUSTMENT stock cannot be negative');
      stockAfter = input.quantity;
      movementQty = Math.abs(stockAfter - stockBefore);
    }

    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: stockAfter },
      });
      return tx.stockMovement.create({
        data: {
          productId: product.id,
          type: input.type,
          quantity: movementQty,
          stockBefore,
          stockAfter,
          reference: input.reference ?? null,
          note: input.note ?? null,
          userId: userId ?? null,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    });
  },
};
