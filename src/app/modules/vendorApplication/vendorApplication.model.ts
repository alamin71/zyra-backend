import { model, Schema } from 'mongoose';
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
