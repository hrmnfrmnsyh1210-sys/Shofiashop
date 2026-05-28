import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import {
  hashToken,
  newJti,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt.js';
import { conflict, unauthorized } from '../../lib/httpError.js';
import { env } from '../../config/env.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import type { User } from '@prisma/client';

const REFRESH_TTL_MS = parseTtlMs(env.JWT_REFRESH_TTL);

function parseTtlMs(ttl: string): number {
  const m = /^(\d+)(ms|s|m|h|d)?$/i.exec(ttl.trim());
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = (m[2] ?? 's').toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return n * (mult[unit] ?? 1000);
}

const issueTokens = async (user: User) => {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });
  const jti = newJti();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });
  return { accessToken, refreshToken };
};

const sanitize = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  tenantId: user.tenantId,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export const authService = {
  // Tenant admins can only create users in their own tenant.
  // SUPER_ADMINs can specify a tenantId (or omit for another super admin).
  register: async (
    input: RegisterInput,
    actor: { role: User['role']; tenantId: string | null },
    targetTenantId: string | null,
  ) => {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw conflict('Email already registered');

    if (input.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw conflict('Only super admins can create super admins');
    }

    let tenantId: string | null;
    if (input.role === 'SUPER_ADMIN') {
      tenantId = null;
    } else if (actor.role === 'SUPER_ADMIN') {
      tenantId = targetTenantId;
      if (!tenantId) throw conflict('tenantId required for non-super-admin users');
    } else {
      tenantId = actor.tenantId;
      if (!tenantId) throw conflict('Actor has no tenant context');
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: await hashPassword(input.password),
        tenantId,
      },
    });
    const tokens = await issueTokens(user);
    return { user: sanitize(user), ...tokens };
  },

  login: async (input: LoginInput) => {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    });
    if (!user || !user.isActive) throw unauthorized('Invalid credentials');
    if (user.role !== 'SUPER_ADMIN' && user.tenant && !user.tenant.isActive) {
      throw unauthorized('Toko sedang nonaktif. Hubungi administrator platform.');
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid credentials');
    const tokens = await issueTokens(user);
    return {
      user: sanitize(user),
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
          }
        : null,
      ...tokens,
    };
  },

  refresh: async (refreshToken: string) => {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Invalid refresh token');
    }
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw unauthorized('Refresh token expired or revoked');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw unauthorized('User no longer active');

    // rotate: revoke old, issue new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await issueTokens(user);
    return { user: sanitize(user), ...tokens };
  },

  logout: async (refreshToken: string) => {
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (stored && !stored.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  },

  me: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
    if (!user) throw unauthorized();
    return {
      user: sanitize(user),
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
          }
        : null,
    };
  },
};
