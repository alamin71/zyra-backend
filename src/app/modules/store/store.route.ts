import express, { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { USER_ROLES } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import auth from '../../middleware/auth';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import { StoreController } from './store.controller';
import { StoreValidation } from './store.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

// Form-data create sends the regular fields JSON-stringified under "data"
// (alongside the logo/banner files) — unpack it into req.body so
// validateRequest sees the real fields instead of one opaque string.
const parseFormDataJson = (req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.body?.data === 'string') {
    try {
      const parsed = JSON.parse(req.body.data);
      req.body = { ...req.body, ...parsed };
      delete req.body.data;
    } catch {
      return next(
        new AppError(StatusCodes.BAD_REQUEST, 'Invalid JSON in "data" field')
      );
    }
  }
  next();
};

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
