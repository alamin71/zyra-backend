import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VirtualCardController } from './virtualCard.controller';
import { VirtualCardValidation } from './virtualCard.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

router.get('/', admin, VirtualCardController.getAllCards);

// One-time manual issuance for the client's first 10 (family) cards, with
// a specific low card number instead of the auto-counter.
router.post(
  '/issue',
  admin,
  validateRequest(VirtualCardValidation.issueCardZodSchema),
  VirtualCardController.issueCard
);

router
  .route('/settings')
  .get(admin, VirtualCardController.getSettings)
  .patch(
    admin,
    validateRequest(VirtualCardValidation.updateSettingsZodSchema),
    VirtualCardController.updateSettings
  );

// No cron infra in this project yet — admin triggers expiry processing
// manually (or this can be wired to a scheduled job later without changing
// the endpoint).
router.post(
  '/process-expired',
  admin,
  VirtualCardController.processExpiredCards
);

export const VirtualCardAdminRoutes = router;
