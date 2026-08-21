import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
const router = express.Router();

const anyAuthenticatedUser = auth(
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.VENDOR,
  USER_ROLES.CUSTOMER
);

router
  .route('/profile')
  .get(anyAuthenticatedUser, UserController.getUserProfile)
  .patch(
    anyAuthenticatedUser,
    s3FileUploadHandler.fields([{ name: 'image', maxCount: 1 }]),
    validateRequest(UserValidation.updateUserZodSchema),
    UserController.updateProfile
  );

router.delete('/delete', anyAuthenticatedUser, UserController.deleteProfile);

export const UserRouter = router;
