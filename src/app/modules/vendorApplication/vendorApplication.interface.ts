import { Model, Types } from 'mongoose';

export const VENDOR_APPLICATION_STATUS = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const;
export type VendorApplicationStatus =
  (typeof VENDOR_APPLICATION_STATUS)[number];

export type IVendorApplication = {
  storeName: string;
  businessField: string;
  email: string;
  status: VendorApplicationStatus;
  reviewedBy?: Types.ObjectId;
  reviewNote?: string;
};

export type VendorApplicationModel = Model<IVendorApplication>;
