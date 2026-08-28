import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import { parseFormDataJson } from '../../middleware/parseFormDataJson';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
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
    s3FileUploadHandler.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
    parseFormDataJson,
    validateRequest(StoreValidation.updateStoreZodSchema),
    StoreController.updateOwnStore
  );

export const StoreVendorRoutes = router;
