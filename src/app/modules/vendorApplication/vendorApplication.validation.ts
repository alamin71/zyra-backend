import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';
import {
  coordinatesSchema,
  operatingHourSchema,
  subCategorySchema,
} from '../store/store.validation';
import { GIFT_CARD_CATEGORIES } from '../store/store.interface';

// The "Join Us" form now collects everything upfront — the vendor's login
// identity (phone/contactName) and store details — so approving needs
// nothing but the application id; rejecting needs nothing but an optional note.
const createVendorApplicationZodSchema = z.object({
  body: z.object({
    storeName: z
      .string()
      .trim()
      .nonempty({ message: 'Store name is required' }),
    businessField: z
      .string()
      .trim()
      .nonempty({ message: 'Business field is required' }),
    email: z.string().trim().email({ message: 'Invalid email address' }),
    contactName: z
      .string()
      .trim()
      .nonempty({ message: "Contact name is required" }),
    phone: z
      .string()
      .trim()
      .min(6, { message: 'A valid phone number is required' }),
    countryCode: z
      .string()
      .trim()
      .nonempty({ message: 'Country code is required' }),
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

const approveVendorApplicationZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid vendor application id'),
  }),
});

const rejectVendorApplicationZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid vendor application id'),
  }),
  body: z.object({
    reviewNote: z.string().trim().optional(),
  }),
});

const vendorApplicationIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid vendor application id'),
  }),
});

export const VendorApplicationValidation = {
  createVendorApplicationZodSchema,
  approveVendorApplicationZodSchema,
  rejectVendorApplicationZodSchema,
  vendorApplicationIdZodSchema,
};
