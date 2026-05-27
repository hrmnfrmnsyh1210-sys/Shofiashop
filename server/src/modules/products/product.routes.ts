import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  CreateProductSchema,
  ListProductQuerySchema,
  UpdateProductSchema,
} from './product.schema.js';
import { productService } from './product.service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validate(ListProductQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await productService.list(req.query as never));
  }),
);

router.get(
  '/barcode/:barcode',
  asyncHandler(async (req, res) => {
    res.json(await productService.getByBarcode(req.params.barcode));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await productService.get(req.params.id));
  }),
);

router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  validate(CreateProductSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await productService.create(req.body));
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate(UpdateProductSchema),
  asyncHandler(async (req, res) => {
    res.json(await productService.update(req.params.id, req.body));
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    res.json(await productService.remove(req.params.id));
  }),
);

export default router;
