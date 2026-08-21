import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

// Phone + OTP auth for CUSTOMER / VENDOR accounts.
// ADMIN / SUPER_ADMIN keep the existing email + password flow under /admin.

router.post(
  '/signup',
  validateRequest(AuthValidation.createSignupZodSchema),
  AuthController.signupUser
);

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

router.post(
  '/verify-otp',
  validateRequest(AuthValidation.createVerifyOtpZodSchema),
  AuthController.verifyOtp
);

router.post(
  '/resend-otp',
  validateRequest(AuthValidation.createResendOtpZodSchema),
  AuthController.resendOtp
);

router.post('/refresh-token', AuthController.refreshToken);

export const AuthRouter = router;
