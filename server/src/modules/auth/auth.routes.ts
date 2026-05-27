import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { LoginSchema, RefreshSchema, RegisterSchema } from './auth.schema.js';
import { authService } from './auth.service.js';
import { unauthorized } from '../../lib/httpError.js';

const router = Router();

// Public registration is restricted to admins-only. If you need bootstrap,
// use the seed script (npm run seed) for the first admin user.
router.post(
  '/register',
  requireAuth,
  requireRole('ADMIN'),
  validate(RegisterSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
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
    const user = await authService.me(req.user.id);
    res.json({ user });
  }),
);

export default router;
