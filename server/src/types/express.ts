// Express.Request augmentation — must be imported (side-effect) from app.ts
// so tsc actually loads the global namespace augmentation.

import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email: string;
      role: UserRole;
    }
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
