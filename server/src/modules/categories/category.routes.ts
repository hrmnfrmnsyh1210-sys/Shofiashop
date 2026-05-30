import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  CreateCategorySchema,
  ListCategoryQuerySchema,
  UpdateCategorySchema,
} from './category.schema.js';
import { categoryService } from './category.service.js';
import { activityService } from '../activity/activity.service.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  '/',
  validate(ListCategoryQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await categoryService.list(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await categoryService.get(req.tenantId!, req.params.id));
  }),
);

router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  validate(CreateCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.tenantId!, req.body);
    activityService.log(req, {
      action: 'category.create',
      entityType: 'Category',
      entityId: category.id,
      summary: `Menambah kategori "${category.name}"`,
    });
    res.status(201).json(category);
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate(UpdateCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await categoryService.update(req.tenantId!, req.params.id, req.body);
    activityService.log(req, {
      action: 'category.update',
      entityType: 'Category',
      entityId: category.id,
      summary: `Memperbarui kategori "${category.name}"`,
    });
    res.json(category);
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const category = await categoryService.get(req.tenantId!, req.params.id);
    const result = await categoryService.remove(req.tenantId!, req.params.id);
    activityService.log(req, {
      action: 'category.delete',
      entityType: 'Category',
      entityId: category.id,
      summary: `Menghapus kategori "${category.name}"`,
    });
    res.json(result);
  }),
);

export default router;
