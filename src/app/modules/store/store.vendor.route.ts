import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { StoreController } from './store.controller';
import { StoreValidation } from './store.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);

router
  .route('/')
  .get(vendor, StoreController.getOwnStore)
  .patch(
    vendor,
    validateRequest(StoreValidation.updateStoreZodSchema),
    StoreController.updateOwnStore
  );

export const StoreVendorRoutes = router;
