import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { LoginSchema, RefreshSchema, RegisterSchema } from './auth.schema.js';
import { authService } from './auth.service.js';
import { unauthorized } from '../../lib/httpError.js';

const router = Router();

// Register a new user. Tenant admins create users within their tenant;
// super admins can create users for any tenant by passing `tenantId`.
router.post(
  '/register',
  requireAuth,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  validate(RegisterSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const { tenantId, ...input } = req.body;
    const result = await authService.register(
      input,
      { role: req.user.role, tenantId: req.user.tenantId },
      tenantId ?? null,
    );
    res.status(201).json(result);
  }),
);

router.post(
  '/login',
  validate(LoginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
);

router.post(
  '/refresh',
  validate(RefreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  }),
);

router.post(
  '/logout',
  validate(RefreshSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.logout(req.body.refreshToken);
    res.json(result);
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const result = await authService.me(req.user.id);
    res.json(result);
  }),
);

export default router;
