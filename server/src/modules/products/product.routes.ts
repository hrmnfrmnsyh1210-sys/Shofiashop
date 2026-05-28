import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  CreateProductSchema,
  ListProductQuerySchema,
  UpdateProductSchema,
} from './product.schema.js';
import { productService } from './product.service.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  '/',
  validate(ListProductQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await productService.list(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/barcode/:barcode',
  asyncHandler(async (req, res) => {
    res.json(await productService.getByBarcode(req.tenantId!, req.params.barcode));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await productService.get(req.tenantId!, req.params.id));
  }),
);

router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  validate(CreateProductSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await productService.create(req.tenantId!, req.body));
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate(UpdateProductSchema),
  asyncHandler(async (req, res) => {
    res.json(await productService.update(req.tenantId!, req.params.id, req.body));
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    res.json(await productService.remove(req.tenantId!, req.params.id));
  }),
);

export default router;
