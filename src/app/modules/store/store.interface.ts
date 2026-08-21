import { Model, Types } from 'mongoose';

export const STORE_MANUAL_STATUS = ['OPEN', 'CLOSED', 'OFFLINE'] as const;
export type StoreManualStatus = (typeof STORE_MANUAL_STATUS)[number];

export const GIFT_CARD_CATEGORIES = [
  'ZYARA_CLASSIC',
  'DENTAL',
  'BEAUTY',
  'GYM',
] as const;
export type GiftCardCategory = (typeof GIFT_CARD_CATEGORIES)[number];

export type IStoreLocation = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type IStoreSubCategory = {
  name: string;
  order: number;
};

export type IStoreOperatingHour = {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  open: string; // "09:00"
  close: string; // "22:00"
};

export type IStore = {
  owner: Types.ObjectId;
  name: string;
  logo?: string;
  banner?: string;
  categories: Types.ObjectId[];
  subCategories: IStoreSubCategory[];
  description?: string;
  location: IStoreLocation;
  addressText: string;
  deliveryFee: number;
  deliveryTimeMinutes: number;
  minOrderAmount: number;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  operatingHours: IStoreOperatingHour[];
  manualStatus: StoreManualStatus;
  rating: { avg: number; count: number };
  isActive: boolean;
  isFeatured: boolean;
  acceptsGiftCardCategories: GiftCardCategory[];
};

export type StoreModel = Model<IStore>;
