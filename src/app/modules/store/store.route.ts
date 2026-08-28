import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import { parseFormDataJson } from '../../middleware/parseFormDataJson';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import { StoreController } from './store.controller';
import { StoreValidation } from './store.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

router
  .route('/')
  .get(StoreController.getStores)
  .post(
    admin,
    s3FileUploadHandler.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
    parseFormDataJson,
    validateRequest(StoreValidation.createStoreZodSchema),
    StoreController.createStore
  );

router.get(
  '/:id',
  validateRequest(StoreValidation.storeIdZodSchema),
  StoreController.getStore
);

router.patch(
  '/:id/moderate',
  admin,
  validateRequest(StoreValidation.moderateStoreZodSchema),
  StoreController.moderateStore
);

export const StoreRoutes = router;
