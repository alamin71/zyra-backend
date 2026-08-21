import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';
import { GIFT_CARD_CATEGORIES } from './store.interface';

// Exported so other modules (e.g. vendor-application approval, which also
// needs to build a Store payload) don't redeclare the same shapes.
export const coordinatesSchema = z
  .tuple([z.number(), z.number()])
  .describe('[longitude, latitude]');

export const subCategorySchema = z.object({
  name: z.string().trim().nonempty(),
  order: z.number().int().optional(),
});

export const operatingHourSchema = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  open: z.string().trim().nonempty(),
  close: z.string().trim().nonempty(),
});

const createStoreZodSchema = z.object({
  body: z.object({
    owner: checkValidID('Invalid owner id'),
    name: z.string().trim().nonempty({ message: 'Store name is required' }),
    addressText: z
      .string()
      .trim()
      .nonempty({ message: 'Store address is required' }),
    location: z.object({ coordinates: coordinatesSchema }),
    categories: z.array(checkValidID('Invalid category id')).optional(),
    subCategories: z.array(subCategorySchema).optional(),
    operatingHours: z.array(operatingHourSchema).optional(),
    deliveryFee: z.number().nonnegative().optional(),
    deliveryTimeMinutes: z.number().int().positive().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    supportsDelivery: z.boolean().optional(),
    supportsPickup: z.boolean().optional(),
    acceptsGiftCardCategories: z.array(z.enum(GIFT_CARD_CATEGORIES)).optional(),
  }),
});

// Self-service update for the store's own vendor — no owner/isActive/isFeatured.
const updateStoreZodSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
    logo: z.string().optional(),
    banner: z.string().optional(),
    addressText: z.string().trim().optional(),
    location: z.object({ coordinates: coordinatesSchema }).optional(),
    categories: z.array(checkValidID('Invalid category id')).optional(),
    subCategories: z.array(subCategorySchema).optional(),
    operatingHours: z.array(operatingHourSchema).optional(),
    deliveryFee: z.number().nonnegative().optional(),
    deliveryTimeMinutes: z.number().int().positive().optional(),
    minOrderAmount: z.number().nonnegative().optional(),
    supportsDelivery: z.boolean().optional(),
    supportsPickup: z.boolean().optional(),
    manualStatus: z.enum(['OPEN', 'CLOSED', 'OFFLINE']).optional(),
    acceptsGiftCardCategories: z.array(z.enum(GIFT_CARD_CATEGORIES)).optional(),
  }),
});

const moderateStoreZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid store id'),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

const storeIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid store id'),
  }),
});

export const StoreValidation = {
  createStoreZodSchema,
  updateStoreZodSchema,
  moderateStoreZodSchema,
  storeIdZodSchema,
};
