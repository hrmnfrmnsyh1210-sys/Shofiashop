import type { Prisma, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { prisma } from '../../lib/prisma.js';
import type { ListActivityQuery } from './activity.schema.js';

export interface ActivityActor {
  id?: string | null;
  email?: string | null;
  role?: UserRole | null;
  tenantId?: string | null;
}

export interface RecordActivityInput {
  tenantId?: string | null;
  actor?: ActivityActor;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary: string;
  metadata?: unknown;
  ipAddress?: string | null;
}

/** Build an actor descriptor from the authenticated request. */
export const actorFromReq = (req: Request): ActivityActor => ({
  id: req.user?.id ?? null,
  email: req.user?.email ?? null,
  role: req.user?.role ?? null,
  tenantId: req.user?.tenantId ?? null,
});

export const activityService = {
  /**
   * Persist an audit entry. Never throws — audit logging must never break
   * the primary request flow. Fire-and-forget friendly (returns a promise
   * you can `void`).
   */
  record: async (input: RecordActivityInput): Promise<void> => {
    try {
      await prisma.activityLog.create({
        data: {
          tenantId: input.tenantId ?? input.actor?.tenantId ?? null,
          userId: input.actor?.id ?? null,
          userEmail: input.actor?.email ?? null,
          userRole: input.actor?.role ?? null,
          action: input.action,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          summary: input.summary,
          metadata:
            input.metadata !== undefined && input.metadata !== null
              ? JSON.stringify(input.metadata)
              : null,
          ipAddress: input.ipAddress ?? null,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[activity] failed to record entry', err);
    }
  },

  /** Convenience: record straight from a request + payload. */
  log: (
    req: Request,
    entry: Omit<RecordActivityInput, 'actor' | 'tenantId' | 'ipAddress'>,
  ): void => {
    void activityService.record({
      ...entry,
      tenantId: req.tenantId ?? req.user?.tenantId ?? null,
      actor: actorFromReq(req),
      ipAddress: req.ip ?? null,
    });
  },

  // Platform-wide listing (SUPER_ADMIN). Pass q.tenantId to narrow to one store.
  list: async (q: ListActivityQuery) => {
    const where: Prisma.ActivityLogWhereInput = {
      ...(q.tenantId ? { tenantId: q.tenantId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.userId ? { userId: q.userId } : {}),
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
              { summary: { contains: q.search } },
              { userEmail: { contains: q.search } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      summary: r.summary,
      metadata: r.metadata,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
      userId: r.userId,
      // prefer live name, fall back to snapshot email for deleted users
      userName: r.user?.name ?? null,
      userEmail: r.user?.email ?? r.userEmail,
      userRole: r.userRole,
      tenantId: r.tenantId,
      tenantName: r.tenant?.name ?? null,
    }));

    return { items, total, page: q.page, pageSize: q.pageSize };
  },
};
