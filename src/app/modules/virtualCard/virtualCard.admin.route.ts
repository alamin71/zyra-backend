import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import { VirtualCardController } from './virtualCard.controller';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

router.get('/', admin, VirtualCardController.getAllVirtualCards);

// No cron infra in this project yet — admin triggers expiry processing
// manually (or this can be wired to a scheduled job later without changing
// the endpoint).
router.post(
  '/process-expired',
  admin,
  VirtualCardController.processExpiredCards
);

export const VirtualCardAdminRoutes = router;
