import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);

router.get('/', vendor, OrderController.getStoreOrders);

router.patch(
  '/:id/status',
  vendor,
  validateRequest(OrderValidation.updateOrderStatusZodSchema),
  OrderController.updateOrderStatus
);

export const OrderVendorRoutes = router;
