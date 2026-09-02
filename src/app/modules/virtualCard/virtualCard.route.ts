import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VirtualCardController } from './virtualCard.controller';
import { VirtualCardValidation } from './virtualCard.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router
  .route('/')
  .get(customer, VirtualCardController.getMyVirtualCards)
  .post(
    customer,
    validateRequest(VirtualCardValidation.loadVirtualCardZodSchema),
    VirtualCardController.loadVirtualCard
  );

// Pending gifts sent to me, and claiming them — before "/:id" so "gifts"
// isn't swallowed as a card id.
router.get('/gifts/incoming', customer, VirtualCardController.getIncomingGifts);

router.post(
  '/gifts/:id/claim',
  customer,
  validateRequest(VirtualCardValidation.giftIdParamZodSchema),
  VirtualCardController.claimGift
);

router.patch(
  '/gifts/:id',
  customer,
  validateRequest(VirtualCardValidation.modifyGiftZodSchema),
  VirtualCardController.modifyGift
);

router.delete(
  '/gifts/:id',
  customer,
  validateRequest(VirtualCardValidation.giftIdParamZodSchema),
  VirtualCardController.cancelGift
);

router.get(
  '/:id',
  customer,
  validateRequest(VirtualCardValidation.cardIdParamZodSchema),
  VirtualCardController.getVirtualCard
);

router.get(
  '/:id/transactions',
  customer,
  validateRequest(VirtualCardValidation.cardIdParamZodSchema),
  VirtualCardController.getCardTransactions
);

router.post(
  '/:id/top-up',
  customer,
  validateRequest(VirtualCardValidation.loadVirtualCardZodSchema),
  VirtualCardController.topUpVirtualCard
);

router.post(
  '/:id/gift',
  customer,
  validateRequest(VirtualCardValidation.giftVirtualCardZodSchema),
  VirtualCardController.giftVirtualCard
);

router.post(
  '/:id/generate-code',
  customer,
  validateRequest(VirtualCardValidation.generateRedemptionCodeZodSchema),
  VirtualCardController.generateRedemptionCode
);

export const VirtualCardRoutes = router;
