import { z } from 'zod';

const phoneField = z
  .string()
  .trim()
  .min(6, { message: 'A valid phone number is required' });

const otpBodySchema = z.object({
  otp: z.preprocess(
    (val) => Number(val),
    z.number().int().nonnegative({ message: 'OTP is required' })
  ),
});

const createSignupZodSchema = z.object({
  body: z.object({
    name: z.string().trim().nonempty({ message: 'Name is required' }),
    phone: phoneField,
    countryCode: z
      .string()
      .trim()
      .nonempty({ message: 'Country code is required' }),
    email: z
      .string()
      .trim()
      .email({ message: 'Invalid email address' })
      .optional(),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    phone: phoneField,
  }),
});

const createVerifyOtpZodSchema = z.object({
  body: otpBodySchema,
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    phone: phoneField.optional(),
  }),
});

export const AuthValidation = {
  createSignupZodSchema,
  createLoginZodSchema,
  createVerifyOtpZodSchema,
  createResendOtpZodSchema,
};
