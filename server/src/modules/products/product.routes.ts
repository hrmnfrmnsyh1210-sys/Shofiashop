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
import { activityService } from '../activity/activity.service.js';

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
    const product = await productService.create(req.tenantId!, req.body);
    activityService.log(req, {
      action: 'product.create',
      entityType: 'Product',
      entityId: product.id,
      summary: `Menambah produk "${product.name}" (SKU ${product.sku})`,
    });
    res.status(201).json(product);
  }),
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  validate(UpdateProductSchema),
  asyncHandler(async (req, res) => {
    const product = await productService.update(req.tenantId!, req.params.id, req.body);
    activityService.log(req, {
      action: 'product.update',
      entityType: 'Product',
      entityId: product.id,
      summary: `Memperbarui produk "${product.name}"`,
    });
    res.json(product);
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const product = await productService.get(req.tenantId!, req.params.id);
    const result = await productService.remove(req.tenantId!, req.params.id);
    activityService.log(req, {
      action: 'product.delete',
      entityType: 'Product',
      entityId: product.id,
      summary: `Menghapus produk "${product.name}"`,
    });
    res.json(result);
  }),
);

export default router;
