import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';

const extractOtpToken = (req: Request): string => {
  const otpToken =
    (req.headers['otp-token'] as string) ||
    (req.headers.authorization as string)?.split(' ')[1];

  if (!otpToken) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'OTP session token is required'
    );
  }

  return otpToken;
};

const withDevOtp = (message: string, otp?: string) =>
  otp ? `${message} [DEV OTP: ${otp}]` : message;

const signupUser = catchAsync(async (req, res) => {
  const result = await AuthService.signupUserToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: withDevOtp('OTP sent to your mobile number.', result.otp),
    data: { otpToken: result.otpToken },
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthService.loginUserFromDB(req.body.phone);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: withDevOtp('OTP sent to your mobile number.', result.otp),
    data: { otpToken: result.otpToken },
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const otpToken = extractOtpToken(req);
  const result = await AuthService.verifyOtpFromDB(
    otpToken,
    Number(req.body.otp)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP verified successfully.',
    data: {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const otpToken = req.headers['otp-token'] as string | undefined;
  const result = await AuthService.resendOtpFromDB(otpToken, req.body.phone);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: withDevOtp('OTP resent successfully.', result.otp),
    data: { otpToken: result.otpToken },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.headers?.refreshtoken as string;
  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

export const AuthController = {
  signupUser,
  loginUser,
  verifyOtp,
  resendOtp,
  refreshToken,
};
