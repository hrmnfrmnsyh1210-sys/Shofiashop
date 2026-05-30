import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  CreateTenantSchema,
  ListTenantQuerySchema,
  UpdateOwnTenantSchema,
  UpdateTenantSchema,
} from './tenant.schema.js';
import { tenantService } from './tenant.service.js';
import { activityService } from '../activity/activity.service.js';

// /super/tenants — managed by SUPER_ADMIN
const superRouter = Router();
superRouter.use(requireAuth, requireRole('SUPER_ADMIN'));

superRouter.get(
  '/',
  validate(ListTenantQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await tenantService.list(req.query as never));
  }),
);

superRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await tenantService.get(req.params.id));
  }),
);

superRouter.post(
  '/',
  validate(CreateTenantSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await tenantService.create(req.body));
  }),
);

superRouter.patch(
  '/:id',
  validate(UpdateTenantSchema),
  asyncHandler(async (req, res) => {
    res.json(await tenantService.update(req.params.id, req.body));
  }),
);

superRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await tenantService.remove(req.params.id));
  }),
);

// /admin/tenant — store admin self-service settings
const adminRouter = Router();
adminRouter.use(requireAuth, requireTenant, requireRole('ADMIN'));

adminRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await tenantService.getOwn(req.tenantId!));
  }),
);

adminRouter.patch(
  '/',
  validate(UpdateOwnTenantSchema),
  asyncHandler(async (req, res) => {
    const tenant = await tenantService.updateOwn(req.tenantId!, req.body);
    activityService.log(req, {
      action: 'tenant.update',
      entityType: 'Tenant',
      entityId: req.tenantId!,
      summary: 'Memperbarui pengaturan toko',
    });
    res.json(tenant);
  }),
);

export { superRouter as tenantSuperRoutes, adminRouter as tenantAdminRoutes };
