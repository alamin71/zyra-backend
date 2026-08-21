import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';
import { ORDER_MODES, PAYMENT_METHODS } from './order.interface';

const checkoutZodSchema = z.object({
  body: z
    .object({
      mode: z.enum(ORDER_MODES),
      addressId: checkValidID('Invalid address id').optional(),
      deliveryTiming: z
        .object({
          type: z.enum(['ASAP', 'SCHEDULED']),
          scheduledAt: z.coerce.date().optional(),
        })
        .optional(),
      substitutionPreference: z.enum(['CONTACT_ME', 'SUBSTITUTE']).optional(),
      arrivalPreference: z
        .object({
          type: z.enum(['DO_NOT_RING', 'CONTACT_ME']),
          note: z.string().trim().optional(),
        })
        .optional(),
      unavailableItemNote: z.string().trim().optional(),
      paymentMethod: z.enum(PAYMENT_METHODS).optional(),
      voucherCode: z.string().trim().optional(),
    })
    .refine((data) => data.mode !== 'DELIVERY' || !!data.addressId, {
      message: 'addressId is required for delivery orders',
      path: ['addressId'],
    })
    .refine(
      (data) =>
        data.deliveryTiming?.type !== 'SCHEDULED' ||
        !!data.deliveryTiming.scheduledAt,
      {
        message: 'scheduledAt is required for scheduled delivery',
        path: ['deliveryTiming', 'scheduledAt'],
      }
    ),
});

const cancelOrderZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid order id'),
  }),
  body: z.object({
    reason: z.string().trim().nonempty({ message: 'Cancellation reason is required' }),
    note: z.string().trim().optional(),
  }),
});

const rateOrderZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid order id'),
  }),
  body: z.object({
    stars: z.number().int().min(1).max(5),
    tags: z.array(z.string().trim()).optional(),
    comment: z.string().trim().optional(),
  }),
});

const orderIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid order id'),
  }),
});

const updateOrderStatusZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid order id'),
  }),
  body: z.object({
    status: z.enum([
      'CONFIRMED',
      'ON_THE_WAY',
      'READY_FOR_PICKUP',
      'DELIVERED',
      'PICKED_UP',
    ]),
  }),
});

export const OrderValidation = {
  checkoutZodSchema,
  cancelOrderZodSchema,
  rateOrderZodSchema,
  orderIdZodSchema,
  updateOrderStatusZodSchema,
};
