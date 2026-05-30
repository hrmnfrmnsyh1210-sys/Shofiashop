import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { ListCitiesQuerySchema } from './shipping.schema.js';
import { shippingService } from './shipping.service.js';

// Public reference data (provinces/cities) — no auth.
// Used both by the storefront destination picker and the admin origin picker.
const router = Router();

router.get(
  '/enabled',
  asyncHandler(async (_req, res) => {
    res.json({ enabled: shippingService.isEnabled() });
  }),
);

router.get(
  '/provinces',
  asyncHandler(async (_req, res) => {
    res.json(await shippingService.getProvinces());
  }),
);

router.get(
  '/cities',
  validate(ListCitiesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { provinceId } = req.query as { provinceId?: string };
    res.json(await shippingService.getCities(provinceId));
  }),
);

export default router;
