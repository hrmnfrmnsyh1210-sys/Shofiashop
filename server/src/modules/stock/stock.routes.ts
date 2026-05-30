import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  ListStockMovementQuerySchema,
  StockAdjustmentSchema,
} from './stock.schema.js';
import { stockService } from './stock.service.js';
import { activityService } from '../activity/activity.service.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  '/movements',
  validate(ListStockMovementQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await stockService.listMovements(req.tenantId!, req.query as never));
  }),
);

router.post(
  '/adjust',
  requireRole('ADMIN', 'MANAGER'),
  validate(StockAdjustmentSchema),
  asyncHandler(async (req, res) => {
    const movement = await stockService.adjust(req.tenantId!, req.body, req.user?.id);
    const typeLabel: Record<string, string> = {
      IN: 'Stok masuk',
      OUT: 'Stok keluar',
      ADJUSTMENT: 'Penyesuaian stok',
      RETURN: 'Retur stok',
    };
    activityService.log(req, {
      action: 'stock.adjust',
      entityType: 'Product',
      entityId: movement.productId,
      summary: `${typeLabel[movement.type] ?? 'Pergerakan stok'} "${movement.product.name}": ${movement.stockBefore} → ${movement.stockAfter}`,
      metadata: { type: movement.type, quantity: movement.quantity },
    });
    res.status(201).json(movement);
  }),
);

export default router;
