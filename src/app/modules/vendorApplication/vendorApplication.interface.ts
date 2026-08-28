import { Model, Types } from 'mongoose';
import {
  GiftCardCategory,
  IStoreLocation,
  IStoreOperatingHour,
  IStoreSubCategory,
} from '../store/store.interface';

export const VENDOR_APPLICATION_STATUS = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;
export type VendorApplicationStatus =
  (typeof VENDOR_APPLICATION_STATUS)[number];

export type IVendorApplication = {
  // Join Us form
  storeName: string;
  businessField: string;
  email: string;
  // Vendor login identity + store details — collected upfront so approval
  // needs nothing but the application id.
  contactName: string;
  phone: string;
  countryCode: string;
  addressText: string;
  location: IStoreLocation;
  categories?: Types.ObjectId[];
  subCategories?: IStoreSubCategory[];
  operatingHours?: IStoreOperatingHour[];
  deliveryFee?: number;
  deliveryTimeMinutes?: number;
  minOrderAmount?: number;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  acceptsGiftCardCategories?: GiftCardCategory[];
  // Review
  status: VendorApplicationStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
};

export type VendorApplicationModel = Model<IVendorApplication>;
