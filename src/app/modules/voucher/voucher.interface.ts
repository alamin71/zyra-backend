import { Model, Types } from 'mongoose';

export const VOUCHER_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_DELIVERY'] as const;
export type VoucherType = (typeof VOUCHER_TYPES)[number];

export type IVoucher = {
  code: string;
  type: VoucherType;
  value: number;
  assignedTo?: Types.ObjectId;
  expiresAt: Date;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
};

export type VoucherModel = Model<IVoucher>;
