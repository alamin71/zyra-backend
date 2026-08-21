import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { FavoriteController } from './favorite.controller';
import { FavoriteValidation } from './favorite.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER);

router
  .route('/')
  .get(customer, FavoriteController.getFavorites)
  .post(
    customer,
    validateRequest(FavoriteValidation.addFavoriteZodSchema),
    FavoriteController.addFavorite
  );

router.delete(
  '/:storeId',
  customer,
  validateRequest(FavoriteValidation.storeIdParamZodSchema),
  FavoriteController.removeFavorite
);

export const FavoriteRoutes = router;
