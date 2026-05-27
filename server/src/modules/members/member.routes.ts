import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import {
  AdjustPointsSchema,
  CreateMemberSchema,
  ListMemberQuerySchema,
  UpdateMemberSchema,
} from './member.schema.js';
import { memberService } from './member.service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validate(ListMemberQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await memberService.list(req.query as never));
  }),
);

router.get(
  '/phone/:phone',
  asyncHandler(async (req, res) => {
    res.json(await memberService.getByPhone(req.params.phone));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await memberService.get(req.params.id));
  }),
);

router.post(
  '/',
  validate(CreateMemberSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await memberService.create(req.body));
  }),
);

router.patch(
  '/:id',
  validate(UpdateMemberSchema),
  asyncHandler(async (req, res) => {
    res.json(await memberService.update(req.params.id, req.body));
  }),
);

router.post(
  '/:id/points',
  validate(AdjustPointsSchema),
  asyncHandler(async (req, res) => {
    res.json(await memberService.adjustPoints(req.params.id, req.body.delta));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await memberService.remove(req.params.id));
  }),
);

export default router;
