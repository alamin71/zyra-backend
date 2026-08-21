import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';
import { VOUCHER_TYPES } from './voucher.interface';

const createVoucherZodSchema = z.object({
  body: z.object({
    code: z.string().trim().nonempty({ message: 'Voucher code is required' }),
    type: z.enum(VOUCHER_TYPES),
    value: z.number().nonnegative(),
    assignedTo: checkValidID('Invalid user id').optional(),
    expiresAt: z.coerce.date({ message: 'A valid expiry date is required' }),
    maxUses: z.number().int().positive().optional(),
  }),
});

const applyVoucherZodSchema = z.object({
  body: z.object({
    code: z.string().trim().nonempty({ message: 'Voucher code is required' }),
  }),
});

const voucherIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid voucher id'),
  }),
});

export const VoucherValidation = {
  createVoucherZodSchema,
  applyVoucherZodSchema,
  voucherIdZodSchema,
};
