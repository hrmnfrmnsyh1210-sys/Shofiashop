import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { unauthorized } from '../../lib/httpError.js';
import {
  CreateUserSchema,
  ListUserQuerySchema,
  UpdateUserSchema,
} from './user.schema.js';
import { userService } from './user.service.js';
import { activityService, actorFromReq } from '../activity/activity.service.js';

const router = Router();

// Platform-wide user management — SUPER_ADMIN only.
router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get(
  '/',
  validate(ListUserQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await userService.list(req.query as never));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await userService.get(req.params.id));
  }),
);

router.post(
  '/',
  validate(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    void activityService.record({
      tenantId: user.tenantId,
      actor: actorFromReq(req),
      ipAddress: req.ip ?? null,
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      summary: `Menambah pengguna "${user.name}" (${user.role})`,
    });
    res.status(201).json(user);
  }),
);

router.patch(
  '/:id',
  validate(UpdateUserSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const user = await userService.update(req.params.id, req.body, req.user.id);
    const changes: string[] = [];
    if (req.body.role !== undefined) changes.push(`role → ${user.role}`);
    if (req.body.isActive !== undefined)
      changes.push(user.isActive ? 'diaktifkan' : 'dinonaktifkan');
    if (req.body.password) changes.push('reset password');
    if (req.body.name !== undefined) changes.push('ubah nama');
    void activityService.record({
      tenantId: user.tenantId,
      actor: actorFromReq(req),
      ipAddress: req.ip ?? null,
      action: 'user.update',
      entityType: 'User',
      entityId: user.id,
      summary: `Memperbarui pengguna "${user.name}"${
        changes.length ? `: ${changes.join(', ')}` : ''
      }`,
    });
    res.json(user);
  }),
);

export default router;
