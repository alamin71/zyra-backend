import { model, Schema } from 'mongoose';
import { GIFT_CARD_CATEGORIES } from '../store/store.interface';
import {
  IVendorApplication,
  VENDOR_APPLICATION_STATUS,
  VendorApplicationModel,
} from './vendorApplication.interface';

const vendorApplicationSchema = new Schema<
  IVendorApplication,
  VendorApplicationModel
>(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    businessField: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    addressText: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    subCategories: {
      type: [
        {
          name: { type: String, required: true },
          order: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    operatingHours: {
      type: [
        {
          day: {
            type: String,
            enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            required: true,
          },
          open: { type: String, required: true },
          close: { type: String, required: true },
        },
      ],
      default: [],
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    deliveryTimeMinutes: {
      type: Number,
      default: 30,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    supportsDelivery: {
      type: Boolean,
      default: true,
    },
    supportsPickup: {
      type: Boolean,
      default: false,
    },
    acceptsGiftCardCategories: {
      type: [{ type: String, enum: GIFT_CARD_CATEGORIES }],
      default: [],
    },
    status: {
      type: String,
      enum: VENDOR_APPLICATION_STATUS,
      default: 'PENDING',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

vendorApplicationSchema.index({ status: 1 });

export const VendorApplication = model<
  IVendorApplication,
  VendorApplicationModel
>('VendorApplication', vendorApplicationSchema);
