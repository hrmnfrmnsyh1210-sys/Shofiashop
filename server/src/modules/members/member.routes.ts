import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireTenant } from '../../middleware/auth.js';
import {
  AdjustPointsSchema,
  CreateMemberSchema,
  ListMemberQuerySchema,
  UpdateMemberSchema,
} from './member.schema.js';
import { memberService } from './member.service.js';
import { activityService } from '../activity/activity.service.js';

const router = Router();

router.use(requireAuth, requireTenant);

router.get(
  '/',
  validate(ListMemberQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await memberService.list(req.tenantId!, req.query as never));
  }),
);

router.get(
  '/phone/:phone',
  asyncHandler(async (req, res) => {
    res.json(await memberService.getByPhone(req.tenantId!, req.params.phone));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await memberService.get(req.tenantId!, req.params.id));
  }),
);

router.post(
  '/',
  validate(CreateMemberSchema),
  asyncHandler(async (req, res) => {
    const member = await memberService.create(req.tenantId!, req.body);
    activityService.log(req, {
      action: 'member.create',
      entityType: 'Member',
      entityId: member.id,
      summary: `Menambah member "${member.name}" (${member.phone})`,
    });
    res.status(201).json(member);
  }),
);

router.patch(
  '/:id',
  validate(UpdateMemberSchema),
  asyncHandler(async (req, res) => {
    const member = await memberService.update(req.tenantId!, req.params.id, req.body);
    activityService.log(req, {
      action: 'member.update',
      entityType: 'Member',
      entityId: member.id,
      summary: `Memperbarui member "${member.name}"`,
    });
    res.json(member);
  }),
);

router.post(
  '/:id/points',
  validate(AdjustPointsSchema),
  asyncHandler(async (req, res) => {
    const member = await memberService.adjustPoints(
      req.tenantId!,
      req.params.id,
      req.body.delta,
    );
    const delta = req.body.delta as number;
    activityService.log(req, {
      action: 'member.points',
      entityType: 'Member',
      entityId: member.id,
      summary: `${delta >= 0 ? 'Menambah' : 'Mengurangi'} poin member "${member.name}" sebanyak ${Math.abs(delta)} (jadi ${member.points})`,
      metadata: { delta, reason: req.body.reason ?? null },
    });
    res.json(member);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const member = await memberService.get(req.tenantId!, req.params.id);
    const result = await memberService.remove(req.tenantId!, req.params.id);
    activityService.log(req, {
      action: 'member.delete',
      entityType: 'Member',
      entityId: member.id,
      summary: `Menghapus member "${member.name}"`,
    });
    res.json(result);
  }),
);

export default router;
