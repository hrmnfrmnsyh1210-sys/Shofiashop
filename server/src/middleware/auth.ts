import type { RequestHandler } from 'express';
import type { UserRole } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt.js';
import { unauthorized, forbidden } from '../lib/httpError.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing Bearer token'));
  }
  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };
    if (payload.tenantId) req.tenantId = payload.tenantId;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
};

export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient role'));
    }
    next();
  };

// Ensures the request is scoped to a tenant (rejects SUPER_ADMIN that
// hasn't picked a tenant). Use AFTER requireAuth on tenant-scoped routes.
export const requireTenant: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!req.tenantId) {
    return next(forbidden('No tenant scope on this request'));
  }
  next();
};
