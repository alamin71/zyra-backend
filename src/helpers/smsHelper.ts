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

// Reuses the same Twilio client as SMS — sending WhatsApp additionally
// requires the Twilio number to be WhatsApp-enabled (a Twilio console
// setting, not something this code can turn on), so this is best-effort
// until the client sets that up. Falls back to a console log either way
// when Twilio isn't configured.
const sendWhatsAppMessage = async (phone: string, body: string): Promise<void> => {
  if (!client) {
    logger.info(`[DEV WHATSAPP] To ${phone}: ${body}`);
    return;
  }

  try {
    await client.messages.create({
      body,
      from: `whatsapp:${config.twilio.phoneNumber}`,
      to: `whatsapp:${phone}`,
    });
    logger.info(`WhatsApp message sent to ${phone}`);
  } catch (error) {
    errorLogger.error('WhatsApp', error);
    throw error;
  }
};

export const smsHelper = {
  sendOTP,
  sendWhatsAppMessage,
  isTwilioConfigured,
};
