import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { superService } from './super.service.js';

const router = Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    res.json(await superService.overview());
  }),
);

export default router;
