import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const checkRecipientZodSchema = z.object({
  body: z.object({
    phone: z.string().trim().min(6, { message: 'A valid phone number is required' }),
  }),
});

const sendCreditZodSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
    recipientPhone: z
      .string()
      .trim()
      .min(6, { message: 'A valid recipient phone number is required' }),
  }),
});

const transferZodSchema = z.object({
  body: z.object({
    recipientPhone: z
      .string()
      .trim()
      .min(6, { message: 'A valid recipient phone number is required' }),
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

const pendingGiftIdParamZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid gift id'),
  }),
});

const respondChargeRequestZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid charge request id'),
  }),
  body: z.object({
    approve: z.boolean(),
  }),
});

const createChargeRequestZodSchema = z.object({
  body: z.object({
    cardNumber: z.string().trim().min(4, { message: 'Card number is required' }),
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

const chargeRequestIdParamZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid charge request id'),
  }),
});

const updateSettingsZodSchema = z.object({
  body: z
    .object({
      loadFeePercent: z.number().min(0).max(100).optional(),
      spendFeePercent: z.number().min(0).max(100).optional(),
      whatsappInviteMessageTemplate: z.string().trim().min(1).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const issueCardZodSchema = z.object({
  body: z.object({
    userId: checkValidID('Invalid user id'),
    cardNumber: z
      .string()
      .trim()
      .regex(/^\d{4,16}$/, { message: 'Card number must be 4-16 digits' }),
  }),
});

export const VirtualCardValidation = {
  checkRecipientZodSchema,
  sendCreditZodSchema,
  transferZodSchema,
  pendingGiftIdParamZodSchema,
  respondChargeRequestZodSchema,
  createChargeRequestZodSchema,
  chargeRequestIdParamZodSchema,
  updateSettingsZodSchema,
  issueCardZodSchema,
};
