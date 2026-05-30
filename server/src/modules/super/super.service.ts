import { prisma } from '../../lib/prisma.js';

export const superService = {
  // Platform-wide snapshot for the super-admin dashboard.
  overview: async () => {
    const [
      tenantTotal,
      tenantActive,
      userTotal,
      productTotal,
      recentTransactions,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.transaction.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { tenant: { select: { id: true, name: true, slug: true } } },
      }),
    ]);

    return {
      tenants: { total: tenantTotal, active: tenantActive },
      users: { total: userTotal },
      products: { total: productTotal },
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        total: t.total,
        status: t.status,
        channel: t.channel,
        createdAt: t.createdAt,
        tenantId: t.tenantId,
        tenantName: t.tenant?.name ?? null,
      })),
    };
  },
};
