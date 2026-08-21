import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router.post(
  '/checkout',
  customer,
  validateRequest(OrderValidation.checkoutZodSchema),
  OrderController.checkout
);

router.get('/', customer, OrderController.getMyOrders);

router.get(
  '/:id',
  customer,
  validateRequest(OrderValidation.orderIdZodSchema),
  OrderController.getMyOrder
);

router.patch(
  '/:id/cancel',
  customer,
  validateRequest(OrderValidation.cancelOrderZodSchema),
  OrderController.cancelMyOrder
);

router.patch(
  '/:id/rate',
  customer,
  validateRequest(OrderValidation.rateOrderZodSchema),
  OrderController.rateMyOrder
);

router.post(
  '/:id/reorder',
  customer,
  validateRequest(OrderValidation.orderIdZodSchema),
  OrderController.reorder
);

export const OrderRoutes = router;
