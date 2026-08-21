import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { USER_ROLES } from '../../../enums/user';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { smsHelper } from '../../../helpers/smsHelper';
import generateOTP from '../../../utils/generateOTP';
import { verifyToken } from '../../../utils/verifyToken';
import { User } from '../user/user.model';

const OTP_EXPIRE_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

type OtpPurpose = 'signup' | 'login';
type OtpTokenPayload = { phone: string; purpose: OtpPurpose };

const issueOtpToken = (phone: string, purpose: OtpPurpose) =>
  jwtHelper.createToken(
    { phone, purpose },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

const decodeOtpToken = (token: string): OtpTokenPayload => {
  let decoded;
  try {
    decoded = jwtHelper.verifyToken(token, config.jwt.jwt_secret as Secret);
  } catch (error) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Invalid or expired OTP session'
    );
  }

  if (!decoded?.phone || !decoded?.purpose) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid OTP session');
  }

  return { phone: decoded.phone, purpose: decoded.purpose };
};

const dispatchOtp = async (userId: string, phone: string): Promise<string> => {
  const otp = generateOTP(6);

  await User.findByIdAndUpdate(userId, {
    $set: {
      authentication: {
        oneTimeCode: Number(otp),
        expireAt: new Date(Date.now() + OTP_EXPIRE_MS),
      },
    },
  });

  await smsHelper.sendOTP(phone, otp);

  return otp;
};

const otpForResponse = (otp: string) =>
  config.node_env !== 'production' ? otp : undefined;

// signup — creates (or resumes) an unverified CUSTOMER and sends an OTP
const signupUserToDB = async (payload: {
  name: string;
  phone: string;
  countryCode: string;
  email?: string;
}) => {
  const { name, phone, countryCode, email } = payload;

  const existing = await User.findOne({ phone });
  if (existing?.verified) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This phone number is already registered. Please login instead.'
    );
  }

  const user =
    existing ??
    (await User.create({
      name,
      phone,
      countryCode,
      email,
      role: USER_ROLES.CUSTOMER,
    }));

  const otp = await dispatchOtp(user._id.toString(), phone);

  return {
    otpToken: issueOtpToken(phone, 'signup'),
    otp: otpForResponse(otp),
  };
};

// login — sends an OTP to an existing CUSTOMER/VENDOR
const loginUserFromDB = async (phone: string) => {
  const user = await User.findOne({ phone });
  if (!user) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'No account found for this number. Please sign up first.'
    );
  }

  if ([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'Please use the admin login for this account.'
    );
  }

  if (user.status === 'blocked') {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked.');
  }

  const otp = await dispatchOtp(user._id.toString(), phone);

  return {
    otpToken: issueOtpToken(phone, 'login'),
    otp: otpForResponse(otp),
  };
};

// verify OTP — completes signup verification or issues session tokens on login
const verifyOtpFromDB = async (otpToken: string, otp: number) => {
  const { phone } = decodeOtpToken(otpToken);

  const user = await User.findOne({ phone }).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const dbOtp = user.authentication?.oneTimeCode;
  const expireAt = user.authentication?.expireAt;

  if (!dbOtp || !expireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Please request a new OTP.');
  }
  if (dbOtp !== otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You provided the wrong OTP.');
  }
  if (new Date() > expireAt) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP already expired, please try again.'
    );
  }

  const verifiedUser = await User.findByIdAndUpdate(
    user._id,
    {
      verified: true,
      $set: {
        'authentication.oneTimeCode': null,
        'authentication.expireAt': null,
      },
    },
    { new: true }
  );

  const jwtData = {
    id: verifiedUser!._id,
    role: verifiedUser!.role,
    phone: verifiedUser!.phone,
    name: verifiedUser!.name,
  };

  const accessToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );
  const refreshToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  return { user: verifiedUser, accessToken, refreshToken };
};

// resend OTP — reuses whichever purpose (signup/login) the caller was already in
const resendOtpFromDB = async (otpToken?: string, phoneInput?: string) => {
  let phone = phoneInput;

  if (otpToken) {
    ({ phone } = decodeOtpToken(otpToken));
  }

  if (!phone) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Phone number is required.');
  }

  const user = await User.findOne({ phone }).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const lastSentAt = user.authentication?.expireAt
    ? new Date(user.authentication.expireAt.getTime() - OTP_EXPIRE_MS)
    : null;

  if (
    lastSentAt &&
    Date.now() - lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      'Please wait a moment before requesting another OTP.'
    );
  }

  const purpose: OtpPurpose = user.verified ? 'login' : 'signup';
  const otp = await dispatchOtp(user._id.toString(), phone);

  return {
    otpToken: issueOtpToken(phone, purpose),
    otp: otpForResponse(otp),
  };
};

// refresh token
const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Token not found');
  }

  const decoded = verifyToken(token, config.jwt.jwt_refresh_secret as Secret);
  const { id } = decoded;

  const activeUser = await User.findById(id);
  if (!activeUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (activeUser.status !== 'active') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is inactive');
  }
  if (!activeUser.verified) {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is not verified');
  }
  if (activeUser.isDeleted) {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is deleted');
  }

  const jwtPayload = {
    id: activeUser._id.toString(),
    role: activeUser.role,
    phone: activeUser.phone,
    name: activeUser.name,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken };
};

export const AuthService = {
  signupUserToDB,
  loginUserFromDB,
  verifyOtpFromDB,
  resendOtpFromDB,
  refreshToken,
};
