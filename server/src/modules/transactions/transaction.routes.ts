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
    res.json(await transactionService.void(req.tenantId!, req.params.id, req.user?.id));
  }),
);

router.patch(
  '/:id/online-status',
  validate(UpdateOnlineStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await transactionService.updateOnlineStatus(req.tenantId!, req.params.id, req.body),
    );
  }),
);

export default router;
