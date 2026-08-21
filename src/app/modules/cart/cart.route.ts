import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { CartController } from './cart.controller';
import { CartValidation } from './cart.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router
  .route('/')
  .get(customer, CartController.getCart)
  .delete(customer, CartController.clearCart);

router.post(
  '/items',
  customer,
  validateRequest(CartValidation.addItemZodSchema),
  CartController.addItem
);

router
  .route('/items/:itemId')
  .patch(
    customer,
    validateRequest(CartValidation.updateItemZodSchema),
    CartController.updateItem
  )
  .delete(
    customer,
    validateRequest(CartValidation.itemIdParamZodSchema),
    CartController.removeItem
  );

export const CartRoutes = router;
