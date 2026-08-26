import twilio from 'twilio';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';

const isTwilioConfigured =
  !!config.twilio.accountSid &&
  !!config.twilio.authToken &&
  !!config.twilio.phoneNumber;

const client = isTwilioConfigured
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

const sendOTP = async (phone: string, otp: string): Promise<void> => {
  if (!client) {
    logger.info(`[DEV SMS] OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    await client.messages.create({
      body: `Your Zyara verification code is ${otp}. It expires in 5 minutes.`,
      from: config.twilio.phoneNumber,
      to: phone,
    });
    logger.info(`SMS OTP sent to ${phone}`);
  } catch (error) {
    errorLogger.error('SMS', error);
    throw error;
  }
};

export const smsHelper = {
  sendOTP,
  isTwilioConfigured,
};
