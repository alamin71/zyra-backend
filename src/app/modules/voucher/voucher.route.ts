import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { VoucherController } from './voucher.controller';
import { VoucherValidation } from './voucher.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);
const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router
  .route('/')
  .get(admin, VoucherController.getVouchers)
  .post(
    admin,
    validateRequest(VoucherValidation.createVoucherZodSchema),
    VoucherController.createVoucher
  );

router.get('/my', customer, VoucherController.getMyVouchers);

router.post(
  '/apply',
  customer,
  validateRequest(VoucherValidation.applyVoucherZodSchema),
  VoucherController.applyVoucher
);

router.delete(
  '/:id',
  admin,
  validateRequest(VoucherValidation.voucherIdZodSchema),
  VoucherController.deleteVoucher
);

export const VoucherRoutes = router;
