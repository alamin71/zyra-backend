import { Model, Types } from 'mongoose';

// Platform takes a cut on every load/top-up (client-confirmed: 5%).
export const PLATFORM_FEE_PERCENT = 5;

export const VIRTUAL_CARD_STATUS = ['ACTIVE', 'EXPIRED', 'CANCELLED'] as const;
export type VirtualCardStatus = (typeof VIRTUAL_CARD_STATUS)[number];

// Client-confirmed: flat 6-month validity (no tiers).
export const VIRTUAL_CARD_VALIDITY_MONTHS = 6;

export type IVirtualCard = {
  owner: Types.ObjectId;
  balance: number;
  status: VirtualCardStatus;
  expiresAt: Date;
};

export type VirtualCardModel = Model<IVirtualCard>;

export const VIRTUAL_CARD_TX_TYPES = [
  'LOAD',
  'TOP_UP',
  'GIFT_SENT',
  'GIFT_RECEIVED',
  'SPEND',
  'REFUND',
] as const;
export type VirtualCardTxType = (typeof VIRTUAL_CARD_TX_TYPES)[number];

export type IVirtualCardTransaction = {
  card: Types.ObjectId;
  type: VirtualCardTxType;
  amount: number; // positive for credit, negative for debit
  balanceAfter: number;
  relatedUser?: Types.ObjectId;
  store?: Types.ObjectId;
  note?: string;
};

export type VirtualCardTransactionModel = Model<IVirtualCardTransaction>;

export const VIRTUAL_CARD_GIFT_STATUS = [
  'PENDING',
  'CLAIMED',
  'CANCELLED',
] as const;
export type VirtualCardGiftStatus = (typeof VIRTUAL_CARD_GIFT_STATUS)[number];

export type IVirtualCardGift = {
  sourceCard: Types.ObjectId;
  fromUser: Types.ObjectId;
  toPhone: string;
  toUser?: Types.ObjectId;
  amount: number;
  status: VirtualCardGiftStatus;
  claimedCard?: Types.ObjectId;
  claimedAt?: Date;
  cancelledAt?: Date;
};

export type VirtualCardGiftModel = Model<IVirtualCardGift>;

export const VIRTUAL_CARD_REDEMPTION_STATUS = [
  'ACTIVE',
  'USED',
  'EXPIRED',
] as const;
export type VirtualCardRedemptionStatus =
  (typeof VIRTUAL_CARD_REDEMPTION_STATUS)[number];

export type IVirtualCardRedemption = {
  card: Types.ObjectId;
  code: string;
  status: VirtualCardRedemptionStatus;
  expiresAt: Date;
  usedAt?: Date;
  usedAmount?: number;
  store?: Types.ObjectId;
};

export type VirtualCardRedemptionModel = Model<IVirtualCardRedemption>;
