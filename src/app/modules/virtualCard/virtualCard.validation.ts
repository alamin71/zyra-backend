import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const loadVirtualCardZodSchema = z.object({
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

const cardIdParamZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid virtual card id'),
  }),
});

const giftVirtualCardZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid virtual card id'),
  }),
  body: z.object({
    recipientPhone: z
      .string()
      .trim()
      .min(6, { message: 'A valid recipient phone number is required' }),
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

const giftIdParamZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid gift id'),
  }),
});

const modifyGiftZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid gift id'),
  }),
  body: z.object({
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

const generateRedemptionCodeZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid virtual card id'),
  }),
});

const redeemCodeZodSchema = z.object({
  body: z.object({
    code: z.string().trim().length(6, { message: 'Invalid redemption code' }),
    amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  }),
});

export const VirtualCardValidation = {
  loadVirtualCardZodSchema,
  cardIdParamZodSchema,
  giftVirtualCardZodSchema,
  giftIdParamZodSchema,
  modifyGiftZodSchema,
  generateRedemptionCodeZodSchema,
  redeemCodeZodSchema,
};
