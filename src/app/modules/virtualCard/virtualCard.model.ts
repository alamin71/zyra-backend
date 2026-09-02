import { model, Schema } from 'mongoose';
import {
  IVirtualCard,
  IVirtualCardGift,
  IVirtualCardRedemption,
  IVirtualCardTransaction,
  VIRTUAL_CARD_GIFT_STATUS,
  VIRTUAL_CARD_REDEMPTION_STATUS,
  VIRTUAL_CARD_STATUS,
  VIRTUAL_CARD_TX_TYPES,
  VirtualCardGiftModel,
  VirtualCardModel,
  VirtualCardRedemptionModel,
  VirtualCardTransactionModel,
} from './virtualCard.interface';

const virtualCardSchema = new Schema<IVirtualCard, VirtualCardModel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    balance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: VIRTUAL_CARD_STATUS,
      default: 'ACTIVE',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

virtualCardSchema.index({ owner: 1, status: 1 });

export const VirtualCard = model<IVirtualCard, VirtualCardModel>(
  'VirtualCard',
  virtualCardSchema
);

const virtualCardTransactionSchema = new Schema<
  IVirtualCardTransaction,
  VirtualCardTransactionModel
>(
  {
    card: { type: Schema.Types.ObjectId, ref: 'VirtualCard', required: true },
    type: { type: String, enum: VIRTUAL_CARD_TX_TYPES, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    relatedUser: { type: Schema.Types.ObjectId, ref: 'User' },
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

virtualCardTransactionSchema.index({ card: 1, createdAt: -1 });

export const VirtualCardTransaction = model<
  IVirtualCardTransaction,
  VirtualCardTransactionModel
>('VirtualCardTransaction', virtualCardTransactionSchema);

const virtualCardGiftSchema = new Schema<
  IVirtualCardGift,
  VirtualCardGiftModel
>(
  {
    sourceCard: {
      type: Schema.Types.ObjectId,
      ref: 'VirtualCard',
      required: true,
    },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toPhone: { type: String, required: true, trim: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true, min: 0.01 },
    status: {
      type: String,
      enum: VIRTUAL_CARD_GIFT_STATUS,
      default: 'PENDING',
    },
    claimedCard: { type: Schema.Types.ObjectId, ref: 'VirtualCard' },
    claimedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

virtualCardGiftSchema.index({ toPhone: 1, status: 1 });
virtualCardGiftSchema.index({ fromUser: 1 });

export const VirtualCardGift = model<IVirtualCardGift, VirtualCardGiftModel>(
  'VirtualCardGift',
  virtualCardGiftSchema
);

const virtualCardRedemptionSchema = new Schema<
  IVirtualCardRedemption,
  VirtualCardRedemptionModel
>(
  {
    card: { type: Schema.Types.ObjectId, ref: 'VirtualCard', required: true },
    code: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: VIRTUAL_CARD_REDEMPTION_STATUS,
      default: 'ACTIVE',
    },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    usedAmount: { type: Number },
    store: { type: Schema.Types.ObjectId, ref: 'Store' },
  },
  { timestamps: true }
);

export const VirtualCardRedemption = model<
  IVirtualCardRedemption,
  VirtualCardRedemptionModel
>('VirtualCardRedemption', virtualCardRedemptionSchema);
