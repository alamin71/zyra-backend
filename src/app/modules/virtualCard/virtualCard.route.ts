import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VirtualCardController } from './virtualCard.controller';
import { VirtualCardValidation } from './virtualCard.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router.get('/me', customer, VirtualCardController.getMyCard);
router.get('/me/transactions', customer, VirtualCardController.getMyTransactions);

router.post(
  '/check-recipient',
  customer,
  validateRequest(VirtualCardValidation.checkRecipientZodSchema),
  VirtualCardController.checkRecipient
);

router.post(
  '/send',
  customer,
  validateRequest(VirtualCardValidation.sendCreditZodSchema),
  VirtualCardController.sendCredit
);

router.post(
  '/transfer',
  customer,
  validateRequest(VirtualCardValidation.transferZodSchema),
  VirtualCardController.transferBalance
);

router.get(
  '/pending-gifts/incoming',
  customer,
  VirtualCardController.getIncomingGifts
);

router.post(
  '/pending-gifts/:id/claim',
  customer,
  validateRequest(VirtualCardValidation.pendingGiftIdParamZodSchema),
  VirtualCardController.claimGift
);

router.get(
  '/charge-requests/pending',
  customer,
  VirtualCardController.getPendingChargeRequests
);

router.patch(
  '/charge-requests/:id/respond',
  customer,
  validateRequest(VirtualCardValidation.respondChargeRequestZodSchema),
  VirtualCardController.respondToChargeRequest
);

export const VirtualCardRoutes = router;
