import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { SupportController } from './support.controller';
import { SupportValidation } from './support.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);
const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

// Help topics — public read ("Get Help" screen), admin-managed
router
  .route('/topics')
  .get(SupportController.getHelpTopics)
  .post(
    admin,
    validateRequest(SupportValidation.createHelpTopicZodSchema),
    SupportController.createHelpTopic
  );

router
  .route('/topics/:id')
  .get(
    validateRequest(SupportValidation.helpTopicIdZodSchema),
    SupportController.getHelpTopic
  )
  .patch(
    admin,
    validateRequest(SupportValidation.updateHelpTopicZodSchema),
    SupportController.updateHelpTopic
  )
  .delete(
    admin,
    validateRequest(SupportValidation.helpTopicIdZodSchema),
    SupportController.deleteHelpTopic
  );

// "Contact Us Directly" — logged-in customer/vendor sends a message, admin reviews it
router.post(
  '/contact',
  customer,
  validateRequest(SupportValidation.createSupportMessageZodSchema),
  SupportController.createSupportMessage
);

router.get('/messages', admin, SupportController.getSupportMessages);

router.patch(
  '/messages/:id',
  admin,
  validateRequest(SupportValidation.updateSupportMessageZodSchema),
  SupportController.updateSupportMessage
);

export const SupportRoutes = router;
