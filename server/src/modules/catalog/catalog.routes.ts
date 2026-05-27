import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import {
  CheckoutSchema,
  ListCatalogQuerySchema,
} from './catalog.schema.js';
import { catalogService } from './catalog.service.js';

// Public — no auth.
const router = Router();

router.get(
  '/products',
  validate(ListCatalogQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await catalogService.listProducts(req.query as never));
  }),
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    res.json(await catalogService.getProduct(req.params.id));
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json(await catalogService.listCategories());
  }),
);

router.post(
  '/checkout',
  validate(CheckoutSchema),
  asyncHandler(async (req, res) => {
    const trx = await catalogService.checkout(req.body);
    res.status(201).json({
      orderNumber: trx.transactionNumber,
      total: trx.total,
      status: trx.status,
      onlineStatus: trx.onlineStatus,
    });
  }),
);

export default router;
