import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VirtualCardController } from './virtualCard.controller';
import { VirtualCardValidation } from './virtualCard.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);

router.post(
  '/redeem',
  vendor,
  validateRequest(VirtualCardValidation.redeemCodeZodSchema),
  VirtualCardController.redeemCode
);

export const VirtualCardVendorRoutes = router;
