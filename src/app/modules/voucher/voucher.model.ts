import { model, Schema } from 'mongoose';
import { IVoucher, VOUCHER_TYPES, VoucherModel } from './voucher.interface';

const voucherSchema = new Schema<IVoucher, VoucherModel>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: VOUCHER_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    maxUses: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

voucherSchema.index({ assignedTo: 1 });

export const Voucher = model<IVoucher, VoucherModel>('Voucher', voucherSchema);
