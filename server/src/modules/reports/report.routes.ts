import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole, requireTenant } from '../../middleware/auth.js';
import {
  DailySalesQuerySchema,
  ReportRangeSchema,
  TopProductsQuerySchema,
} from './report.schema.js';
import { reportService } from './report.service.js';

const router = Router();

router.use(requireAuth, requireTenant, requireRole('ADMIN', 'MANAGER'));

router.get(
  '/summary',
  validate(ReportRangeSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await reportService.summary(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/top-products',
  validate(TopProductsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await reportService.topProducts(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/daily-sales',
  validate(DailySalesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await reportService.dailySales(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/low-stock',
  asyncHandler(async (req, res) => {
    res.json(await reportService.lowStock(req.tenantId!));
  }),
);

export default router;
