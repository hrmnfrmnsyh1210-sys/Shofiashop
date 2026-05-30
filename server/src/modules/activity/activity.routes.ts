import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ListActivityQuerySchema } from './activity.schema.js';
import { activityService } from './activity.service.js';

const router = Router();

// Platform audit trail — SUPER_ADMIN only, spans every tenant.
router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get(
  '/',
  validate(ListActivityQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await activityService.list(req.query as never));
  }),
);

export default router;
