import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  CreateTransactionSchema,
  ListTransactionQuerySchema,
  UpdateOnlineStatusSchema,
} from './transaction.schema.js';
import { transactionService } from './transaction.service.js';
import { activityService } from '../activity/activity.service.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  '/',
  validate(ListTransactionQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await transactionService.list(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await transactionService.get(req.tenantId!, req.params.id));
  }),
);

router.post(
  '/',
  validate(CreateTransactionSchema),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await transactionService.create(req.tenantId!, req.body, req.user?.id));
  }),
);

router.post(
  '/:id/void',
  requireRole('ADMIN', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const trx = await transactionService.void(req.tenantId!, req.params.id, req.user?.id);
    activityService.log(req, {
      action: 'transaction.void',
      entityType: 'Transaction',
      entityId: trx.id,
      summary: `Membatalkan (void) transaksi ${trx.transactionNumber}`,
    });
    res.json(trx);
  }),
);

router.patch(
  '/:id/online-status',
  validate(UpdateOnlineStatusSchema),
  asyncHandler(async (req, res) => {
    const trx = await transactionService.updateOnlineStatus(
      req.tenantId!,
      req.params.id,
      req.body,
    );
    activityService.log(req, {
      action: 'transaction.online_status',
      entityType: 'Transaction',
      entityId: trx.id,
      summary: `Mengubah status pesanan ${trx.transactionNumber} → ${trx.onlineStatus}`,
    });
    res.json(trx);
  }),
);

export default router;
