import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { badRequest, conflict, notFound } from '../../lib/httpError.js';
import { generateTransactionNumber } from '../../lib/transactionNumber.js';
import { komshipService } from '../shipping/komship.service.js';
import type {
  CreateShipmentInput,
  CreateTransactionInput,
  ListTransactionQuery,
  UpdateOnlineStatusInput,
  UpdateTrackingInput,
} from './transaction.schema.js';

const D = (n: number | Prisma.Decimal) => new Prisma.Decimal(n);

export const transactionService = {
  list: async (tenantId: string, q: ListTransactionQuery) => {
    const where: Prisma.TransactionWhereInput = {
      tenantId,
      ...(q.channel ? { channel: q.channel } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.paymentMethod ? { paymentMethod: q.paymentMethod } : {}),
      ...(q.cashierId ? { cashierId: q.cashierId } : {}),
      ...(q.memberId ? { memberId: q.memberId } : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: q.from } : {}),
              ...(q.to ? { lte: q.to } : {}),
            },
          }
        : {}),
      ...(q.search
        ? {
            OR: [
              { transactionNumber: { contains: q.search } },
              { customerName: { contains: q.search } },
              { customerPhone: { contains: q.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          member: { select: { id: true, name: true, phone: true } },
          cashier: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  },

  get: async (tenantId: string, id: string) => {
    const trx = await prisma.transaction.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        member: true,
        cashier: { select: { id: true, name: true, email: true } },
      },
    });
    if (!trx) throw notFound('Transaction not found');
    return trx;
  },

  create: async (tenantId: string, input: CreateTransactionInput, cashierId?: string) => {
    if (input.memberId) {
      const member = await prisma.member.findFirst({
        where: { id: input.memberId, tenantId },
      });
      if (!member) throw badRequest('Member not found');
    }

    const productIds = input.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
    });
    if (products.length !== productIds.length) {
      throw badRequest('One or more products not found');
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = D(0);
    const itemRows = input.items.map((it) => {
      const product = productMap.get(it.productId)!;
      if (!product.isActive) {
        throw badRequest(`Product "${product.name}" is inactive`);
      }
      if (product.stock < it.quantity) {
        throw conflict(
          `Insufficient stock for "${product.name}": have ${product.stock}, need ${it.quantity}`,
        );
      }
      const unitPrice = D(it.unitPrice ?? Number(product.price));
      const lineDiscount = D(it.discount);
      const lineSub = unitPrice.mul(it.quantity).minus(lineDiscount);
      subtotal = subtotal.plus(lineSub);
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: it.quantity,
        unitPrice,
        unitCost: product.costPrice,
        discount: lineDiscount,
        subtotal: lineSub,
      };
    });

    const headerDiscount = D(input.discount);
    const tax = D(input.tax);
    const shipping = D(input.shippingFee);
    const total = subtotal.minus(headerDiscount).plus(tax).plus(shipping);
    if (total.isNegative()) throw badRequest('Total cannot be negative');

    const paymentAmount = D(input.paymentAmount);
    let status: 'PAID' | 'PENDING' = 'PAID';
    let changeAmount = D(0);

    if (input.channel === 'POS') {
      if (input.paymentMethod === 'CASH') {
        if (paymentAmount.lessThan(total)) {
          throw badRequest('Cash payment is less than total');
        }
        changeAmount = paymentAmount.minus(total);
      } else if (paymentAmount.lessThan(total)) {
        status = 'PENDING';
      }
    } else {
      status = paymentAmount.greaterThanOrEqualTo(total) ? 'PAID' : 'PENDING';
    }

    const transactionNumber = generateTransactionNumber(
      input.channel === 'ONLINE' ? 'ORD' : 'TRX',
    );

    return prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          tenantId,
          transactionNumber,
          channel: input.channel,
          status,
          paymentMethod: input.paymentMethod,
          cashierId: cashierId ?? null,
          memberId: input.memberId ?? null,
          customerName: input.customerName ?? null,
          customerPhone: input.customerPhone ?? null,
          shippingAddress: input.shippingAddress ?? null,
          shippingCourier: input.shippingCourier ?? null,
          shippingService: input.shippingService ?? null,
          shippingEtd: input.shippingEtd ?? null,
          destinationCity: input.destinationCity ?? null,
          destinationId: input.destinationId ?? null,
          onlineStatus: input.channel === 'ONLINE' ? 'NEW' : null,
          subtotal,
          discount: headerDiscount,
          tax,
          shippingFee: shipping,
          total,
          paymentAmount,
          changeAmount,
          notes: input.notes ?? null,
          items: { create: itemRows },
        },
        include: { items: true },
      });

      for (const row of itemRows) {
        const product = productMap.get(row.productId)!;
        const stockBefore = product.stock;
        const stockAfter = stockBefore - row.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: stockAfter },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: product.id,
            type: 'OUT',
            quantity: row.quantity,
            stockBefore,
            stockAfter,
            transactionId: trx.id,
            userId: cashierId ?? null,
            reference: trx.transactionNumber,
          },
        });
      }

      if (input.memberId) {
        const pointsEarned = Math.floor(Number(total) / 10000);
        if (pointsEarned > 0) {
          await tx.member.update({
            where: { id: input.memberId },
            data: { points: { increment: pointsEarned } },
          });
        }
      }

      return trx;
    });
  },

  void: async (tenantId: string, id: string, userId?: string) => {
    const trx = await transactionService.get(tenantId, id);
    if (trx.status === 'VOIDED') throw badRequest('Transaction already voided');
    if (trx.status === 'REFUNDED') throw badRequest('Cannot void a refunded transaction');

    return prisma.$transaction(async (tx) => {
      for (const item of trx.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;
        const stockBefore = product.stock;
        const stockAfter = stockBefore + item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: stockAfter },
        });
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: product.id,
            type: 'RETURN',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            transactionId: trx.id,
            userId: userId ?? null,
            reference: `VOID:${trx.transactionNumber}`,
          },
        });
      }

      if (trx.memberId) {
        const pointsEarned = Math.floor(Number(trx.total) / 10000);
        if (pointsEarned > 0) {
          const m = await tx.member.findUnique({ where: { id: trx.memberId } });
          if (m) {
            const next = Math.max(0, m.points - pointsEarned);
            await tx.member.update({
              where: { id: trx.memberId },
              data: { points: next },
            });
          }
        }
      }

      return tx.transaction.update({
        where: { id: trx.id },
        data: { status: 'VOIDED' },
        include: { items: true },
      });
    });
  },

  updateOnlineStatus: async (
    tenantId: string,
    id: string,
    input: UpdateOnlineStatusInput,
  ) => {
    const trx = await transactionService.get(tenantId, id);
    if (trx.channel !== 'ONLINE') {
      throw badRequest('Only ONLINE transactions have onlineStatus');
    }
    return prisma.transaction.update({
      where: { id },
      data: {
        onlineStatus: input.onlineStatus,
        // stamp the ship date the first time it reaches SHIPPED
        ...(input.onlineStatus === 'SHIPPED' && !trx.shippedAt
          ? { shippedAt: new Date() }
          : {}),
      },
      include: { items: true },
    });
  },

  // Save the resi/AWB (and optional courier override) for an online order, and
  // advance it to SHIPPED.
  updateTracking: async (
    tenantId: string,
    id: string,
    input: UpdateTrackingInput,
  ) => {
    const trx = await transactionService.get(tenantId, id);
    if (trx.channel !== 'ONLINE') {
      throw badRequest('Hanya pesanan online yang punya nomor resi.');
    }
    return prisma.transaction.update({
      where: { id },
      data: {
        trackingNumber: input.trackingNumber.trim(),
        ...(input.shippingCourier ? { shippingCourier: input.shippingCourier } : {}),
        ...(input.shippingService ? { shippingService: input.shippingService } : {}),
        onlineStatus: 'SHIPPED',
        shippedAt: trx.shippedAt ?? new Date(),
      },
      include: { items: true },
    });
  },

  // Fetch live courier tracking for an online order from its stored resi.
  track: async (tenantId: string, id: string) => {
    const trx = await transactionService.get(tenantId, id);
    if (trx.channel !== 'ONLINE') {
      throw badRequest('Hanya pesanan online yang bisa dilacak.');
    }
    if (!trx.trackingNumber) {
      throw badRequest('Pesanan ini belum memiliki nomor resi.');
    }
    if (!trx.shippingCourier) {
      throw badRequest('Kurir pengiriman belum diatur untuk pesanan ini.');
    }
    return komshipService.trackWaybill({
      waybill: trx.trackingNumber,
      courier: trx.shippingCourier,
    });
  },

  // Auto-create a Komship delivery order, schedule pickup, and capture the resi
  // (AWB). Advances the order to SHIPPED. This replaces manual resi entry when
  // Komship is configured.
  createShipment: async (tenantId: string, id: string, input: CreateShipmentInput) => {
    const trx = await transactionService.get(tenantId, id);
    if (trx.channel !== 'ONLINE') {
      throw badRequest('Hanya pesanan online yang bisa dikirim otomatis.');
    }
    if (trx.trackingNumber) {
      throw badRequest('Pesanan ini sudah memiliki resi.');
    }
    if (!trx.shippingCourier || !trx.shippingService) {
      throw badRequest('Kurir/layanan pengiriman pesanan ini belum lengkap.');
    }
    if (!trx.destinationId) {
      throw badRequest('Tujuan pengiriman pesanan ini tidak punya ID wilayah. Pesanan lama mungkin perlu diinput resi manual.');
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw notFound('Toko tidak ditemukan.');
    if (!tenant.originCityId) {
      throw badRequest('Toko belum mengatur lokasi asal pengiriman di Pengaturan.');
    }
    const shipperName = tenant.senderName || tenant.name;
    const shipperPhone = tenant.senderPhone || tenant.whatsapp;
    if (!shipperPhone) {
      throw badRequest('No. HP pengirim belum diisi di Pengaturan Toko.');
    }

    // Per-item product detail (weight needed for the courier label).
    const products = await prisma.product.findMany({
      where: { id: { in: trx.items.map((i) => i.productId) }, tenantId },
      select: { id: true, weight: true },
    });
    const weightOf = new Map(products.map((p) => [p.id, p.weight]));

    const isCod = trx.paymentMethod === 'CASH';
    const grandTotal = Math.round(Number(trx.total));
    const shipperAddress = [
      tenant.address,
      tenant.originSubdistrict,
      tenant.originDistrict,
      tenant.originCity,
      tenant.originProvince,
      tenant.originZipCode,
    ]
      .filter(Boolean)
      .join(', ');

    const order = await komshipService.createOrder({
      order_date: trx.createdAt.toISOString(),
      brand_name: tenant.name,
      shipper_name: shipperName,
      shipper_phone: shipperPhone,
      shipper_email: tenant.email ?? '',
      shipper_destination_id: Number(tenant.originCityId),
      shipper_address: shipperAddress || tenant.name,
      origin_pin_point: '',
      receiver_name: trx.customerName ?? '',
      receiver_phone: trx.customerPhone ?? '',
      receiver_email: '',
      receiver_destination_id: Number(trx.destinationId),
      receiver_address: trx.shippingAddress ?? '',
      destination_pin_point: '',
      shipping: trx.shippingCourier.toUpperCase(),
      shipping_type: trx.shippingService,
      payment_method: isCod ? 'COD' : 'BANK TRANSFER',
      shipping_cost: Math.round(Number(trx.shippingFee)),
      shipping_cashback: 0,
      service_fee: 0,
      additional_cost: 0,
      grand_total: grandTotal,
      cod_value: isCod ? grandTotal : 0,
      insurance_value: 0,
      order_details: trx.items.map((it) => ({
        product_name: it.productName,
        product_variant_name: '',
        product_price: Math.round(Number(it.unitPrice)),
        product_weight: weightOf.get(it.productId) ?? 1000,
        product_width: 10,
        product_height: 10,
        product_length: 10,
        qty: it.quantity,
        subtotal: Math.round(Number(it.subtotal)),
      })),
    });

    // Schedule pickup — this returns the AWB (resi).
    const today = new Date().toISOString().slice(0, 10);
    const pickup = await komshipService.requestPickup({
      orderNo: order.order_no,
      pickupDate: input.pickupDate ?? today,
      pickupTime: input.pickupTime,
      pickupVehicle: input.pickupVehicle,
    });

    // The AWB may also be fetched via order detail (and the live tracking URL).
    let awb = pickup?.awb ?? '';
    let labelUrl: string | null = null;
    try {
      const detail = await komshipService.orderDetail(order.order_no);
      if (detail.awb) awb = detail.awb;
      labelUrl = detail.live_tracking_url || null;
    } catch {
      // detail is best-effort; we already have the order/awb from pickup
    }

    return prisma.transaction.update({
      where: { id },
      data: {
        shipmentOrderNo: order.order_no,
        trackingNumber: awb || null,
        labelUrl,
        onlineStatus: 'SHIPPED',
        shippedAt: trx.shippedAt ?? new Date(),
      },
      include: { items: true },
    });
  },
};
