import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import {
  ListStockMovementQuerySchema,
  StockAdjustmentSchema,
} from './stock.schema.js';
import { stockService } from './stock.service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/movements',
  validate(ListStockMovementQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await stockService.listMovements(req.query as never));
  }),
);

router.post(
  '/adjust',
  requireRole('ADMIN', 'MANAGER'),
  validate(StockAdjustmentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await stockService.adjust(req.body, req.user?.id));
  }),
);

export default router;
