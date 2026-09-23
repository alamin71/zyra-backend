import { Model, Types } from 'mongoose';

export const VIRTUAL_CARD_STATUS = ['ACTIVE', 'CANCELLED'] as const;
export type VirtualCardStatus = (typeof VIRTUAL_CARD_STATUS)[number];

// Client-confirmed: flat 6-month validity per load/top-up.
export const VIRTUAL_CARD_VALIDITY_MONTHS = 6;

// The card itself is permanent (like a real credit card number) — expiry
// only zeroes the balance and flags it for manual refund, it never retires
// the card or its number.
export type IVirtualCard = {
  owner: Types.ObjectId;
  cardNumber: string; // 16 digits, zero-padded, e.g. "0000000000000011"
  balance: number;
  status: VirtualCardStatus;
  expiresAt: Date;
};

export type VirtualCardModel = Model<IVirtualCard>;

export const VIRTUAL_CARD_TX_TYPES = [
  'LOAD',
  'TRANSFER_SENT',
  'TRANSFER_RECEIVED',
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

// A sender sent credit to a phone that isn't a registered Zyara user yet.
// Money has already been taken from the sender (Stripe) — this just holds
// it until the recipient signs up and claims it.
export const PENDING_GIFT_STATUS = ['PENDING', 'CLAIMED', 'CANCELLED'] as const;
export type PendingGiftStatus = (typeof PENDING_GIFT_STATUS)[number];

export type IVirtualCardPendingGift = {
  fromUser: Types.ObjectId;
  toPhone: string;
  amount: number;
  status: PendingGiftStatus;
  claimedCard?: Types.ObjectId;
  claimedAt?: Date;
  cancelledAt?: Date;
};

export type VirtualCardPendingGiftModel = Model<IVirtualCardPendingGift>;

// A merchant-initiated charge, awaiting the cardholder's real-time
// approve/decline (client-confirmed: 3-minute window, Syria's internet can
// be slow). The merchant never sees the card's balance — only this
// request's own status.
export const CHARGE_REQUEST_STATUS = [
  'PENDING',
  'APPROVED',
  'DECLINED',
  'EXPIRED',
] as const;
export type ChargeRequestStatus = (typeof CHARGE_REQUEST_STATUS)[number];

export type IVirtualCardChargeRequest = {
  card: Types.ObjectId;
  store: Types.ObjectId;
  amount: number;
  status: ChargeRequestStatus;
  expiresAt: Date;
  respondedAt?: Date;
};

export type VirtualCardChargeRequestModel = Model<IVirtualCardChargeRequest>;

// Admin-controlled, from the client's dashboard — never hardcode these.
// Singleton document, addressed by a fixed string _id.
export type IVirtualCardSettings = {
  _id: string;
  loadFeePercent: number;
  spendFeePercent: number;
  whatsappInviteMessageTemplate: string;
};

export type VirtualCardSettingsModel = Model<IVirtualCardSettings>;

export type ICardNumberCounter = {
  _id: string;
  seq: number;
};

export type CardNumberCounterModel = Model<ICardNumberCounter>;
