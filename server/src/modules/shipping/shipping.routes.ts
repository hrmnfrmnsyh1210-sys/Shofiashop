import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { SearchDestinationQuerySchema } from './shipping.schema.js';
import { shippingService } from './shipping.service.js';
import { komshipService } from './komship.service.js';

// Public reference data (destination search) — no auth.
// Used both by the storefront destination picker and the admin origin picker.
const router = Router();

router.get(
  '/enabled',
  asyncHandler(async (_req, res) => {
    res.json({
      enabled: shippingService.isEnabled(),
      komshipEnabled: komshipService.isEnabled(),
    });
  }),
);

router.get(
  '/destinations',
  validate(SearchDestinationQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { search } = req.query as { search: string };
    res.json(await shippingService.searchDestinations(search));
  }),
);

export default router;
