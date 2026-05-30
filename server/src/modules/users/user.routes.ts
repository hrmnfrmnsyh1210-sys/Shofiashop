import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import { unauthorized } from '../../lib/httpError.js';
import {
  CreateUserSchema,
  ListUserQuerySchema,
  UpdateUserSchema,
} from './user.schema.js';
import { userService } from './user.service.js';
import { activityService } from '../activity/activity.service.js';

const router = Router();

// Staff management is admin-only and tenant-scoped.
router.use(requireAuth, requireTenant, requireRole('ADMIN'));

router.get(
  '/',
  validate(ListUserQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await userService.list(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await userService.get(req.tenantId!, req.params.id));
  }),
);

router.post(
  '/',
  validate(CreateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.tenantId!, req.body);
    activityService.log(req, {
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
    const user = await userService.update(
      req.tenantId!,
      req.params.id,
      req.body,
      req.user.id,
    );
    const changes: string[] = [];
    if (req.body.role !== undefined) changes.push(`role → ${user.role}`);
    if (req.body.isActive !== undefined)
      changes.push(user.isActive ? 'diaktifkan' : 'dinonaktifkan');
    if (req.body.password) changes.push('reset password');
    if (req.body.name !== undefined) changes.push('ubah nama');
    activityService.log(req, {
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
