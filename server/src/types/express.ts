// Express.Request augmentation — must be imported (side-effect) from app.ts
// so tsc actually loads the global namespace augmentation.

import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      role: UserRole;
      tenantId: string | null;
    }
    interface Request {
      user?: AuthUser;
      // resolved tenant for this request:
      // - from JWT for /admin/*, /products, /categories, etc.
      // - from :slug param for /stores/:slug/catalog/*
      tenantId?: string;
    }
  }
}

export {};
