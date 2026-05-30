import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { notFound } from '../../lib/httpError.js';
import { prisma } from '../../lib/prisma.js';
import {
  CheckoutSchema,
  ListCatalogQuerySchema,
  OrderLookupQuerySchema,
} from './catalog.schema.js';
import { ShippingCostSchema } from '../shipping/shipping.schema.js';
import { catalogService } from './catalog.service.js';

// Public — no auth. Mounted at /stores
const router = Router({ mergeParams: true });

// Resolve tenant from :slug for all child routes.
router.param('slug', async (req, _res, next, slug) => {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!tenant) return next(notFound('Store not found'));
    (req as { tenantId?: string }).tenantId = tenant.id;
    next();
  } catch (e) {
    next(e);
  }
});

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(await catalogService.getStoreBySlug(req.params.slug));
  }),
);

router.get(
  '/:slug/products',
  validate(ListCatalogQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.listProducts(
        (req as { tenantId: string }).tenantId,
        req.query as never,
      ),
    );
  }),
);

router.get(
  '/:slug/products/:id',
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.getProduct(
        (req as { tenantId: string }).tenantId,
        req.params.id,
      ),
    );
  }),
);

router.get(
  '/:slug/categories',
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.listCategories((req as { tenantId: string }).tenantId),
    );
  }),
);

router.post(
  '/:slug/shipping/cost',
  validate(ShippingCostSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.shippingCost(
        (req as { tenantId: string }).tenantId,
        req.body,
      ),
    );
  }),
);

router.get(
  '/:slug/orders/:orderNumber',
  validate(OrderLookupQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.getOrderStatus(
        (req as { tenantId: string }).tenantId,
        req.params.orderNumber,
        (req.query as { phone: string }).phone,
      ),
    );
  }),
);

router.get(
  '/:slug/orders/:orderNumber/tracking',
  validate(OrderLookupQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(
      await catalogService.trackOrder(
        (req as { tenantId: string }).tenantId,
        req.params.orderNumber,
        (req.query as { phone: string }).phone,
      ),
    );
  }),
);

router.post(
  '/:slug/checkout',
  validate(CheckoutSchema),
  asyncHandler(async (req, res) => {
    const trx = await catalogService.checkout(
      (req as { tenantId: string }).tenantId,
      req.body,
    );
    res.status(201).json({
      orderNumber: trx.transactionNumber,
      total: trx.total,
      status: trx.status,
      onlineStatus: trx.onlineStatus,
    });
  }),
);

export default router;
