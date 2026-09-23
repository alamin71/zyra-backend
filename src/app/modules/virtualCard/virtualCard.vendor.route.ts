import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VirtualCardController } from './virtualCard.controller';
import { VirtualCardValidation } from './virtualCard.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);

router.post(
  '/charge-requests',
  vendor,
  validateRequest(VirtualCardValidation.createChargeRequestZodSchema),
  VirtualCardController.createChargeRequest
);

router.get(
  '/charge-requests/:id',
  vendor,
  validateRequest(VirtualCardValidation.chargeRequestIdParamZodSchema),
  VirtualCardController.getChargeRequestStatus
);

export const VirtualCardVendorRoutes = router;
