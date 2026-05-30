import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import { ListActivityQuerySchema } from './activity.schema.js';
import { activityService } from './activity.service.js';

const router = Router();

// Audit trail is sensitive — restrict to store managers and admins.
router.use(requireAuth, requireTenant, requireRole('ADMIN', 'MANAGER'));

router.get(
  '/',
  validate(ListActivityQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await activityService.list(req.tenantId!, req.query as never));
  }),
);

export default router;
