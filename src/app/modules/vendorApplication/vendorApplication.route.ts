import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VendorApplicationController } from './vendorApplication.controller';
import { VendorApplicationValidation } from './vendorApplication.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

router
  .route('/')
  .post(
    validateRequest(VendorApplicationValidation.createVendorApplicationZodSchema),
    VendorApplicationController.createVendorApplication
  )
  .get(admin, VendorApplicationController.getVendorApplications);

router.patch(
  '/:id/approve',
  admin,
  validateRequest(VendorApplicationValidation.approveVendorApplicationZodSchema),
  VendorApplicationController.approveVendorApplication
);

router.patch(
  '/:id/reject',
  admin,
  validateRequest(VendorApplicationValidation.rejectVendorApplicationZodSchema),
  VendorApplicationController.rejectVendorApplication
);

export const VendorApplicationRoutes = router;
