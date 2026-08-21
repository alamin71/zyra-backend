import { model, Schema } from 'mongoose';
import {
  GIFT_CARD_CATEGORIES,
  IStore,
  STORE_MANUAL_STATUS,
  StoreModel,
} from './store.interface';

const storeSchema = new Schema<IStore, StoreModel>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
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
    description: {
      type: String,
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
    addressText: {
      type: String,
      required: true,
      trim: true,
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
    manualStatus: {
      type: String,
      enum: STORE_MANUAL_STATUS,
      default: 'OPEN',
    },
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    acceptsGiftCardCategories: {
      type: [{ type: String, enum: GIFT_CARD_CATEGORIES }],
      default: [],
    },
  },
  { timestamps: true }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ owner: 1 });
storeSchema.index({ categories: 1 });
storeSchema.index({ name: 'text', description: 'text' });

export const Store = model<IStore, StoreModel>('Store', storeSchema);
