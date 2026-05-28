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
    res.status(201).json(await categoryService.create(req.tenantId!, req.body));
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate(UpdateCategorySchema),
  asyncHandler(async (req, res) => {
    res.json(await categoryService.update(req.tenantId!, req.params.id, req.body));
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    res.json(await categoryService.remove(req.tenantId!, req.params.id));
  }),
);

export default router;
