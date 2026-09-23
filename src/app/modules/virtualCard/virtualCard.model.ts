import { model, Schema } from 'mongoose';
import {
  CHARGE_REQUEST_STATUS,
  CardNumberCounterModel,
  ICardNumberCounter,
  IVirtualCard,
  IVirtualCardChargeRequest,
  IVirtualCardPendingGift,
  IVirtualCardSettings,
  IVirtualCardTransaction,
  PENDING_GIFT_STATUS,
  VIRTUAL_CARD_STATUS,
  VIRTUAL_CARD_TX_TYPES,
  VirtualCardChargeRequestModel,
  VirtualCardModel,
  VirtualCardPendingGiftModel,
  VirtualCardSettingsModel,
  VirtualCardTransactionModel,
} from './virtualCard.interface';

const virtualCardSchema = new Schema<IVirtualCard, VirtualCardModel>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    cardNumber: { type: String, required: true, unique: true },
    balance: { type: Number, required: true, min: 0, default: 0 },
    status: { type: String, enum: VIRTUAL_CARD_STATUS, default: 'ACTIVE' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

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

const virtualCardPendingGiftSchema = new Schema<
  IVirtualCardPendingGift,
  VirtualCardPendingGiftModel
>(
  {
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toPhone: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: PENDING_GIFT_STATUS, default: 'PENDING' },
    claimedCard: { type: Schema.Types.ObjectId, ref: 'VirtualCard' },
    claimedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

virtualCardPendingGiftSchema.index({ toPhone: 1, status: 1 });

export const VirtualCardPendingGift = model<
  IVirtualCardPendingGift,
  VirtualCardPendingGiftModel
>('VirtualCardPendingGift', virtualCardPendingGiftSchema);

const virtualCardChargeRequestSchema = new Schema<
  IVirtualCardChargeRequest,
  VirtualCardChargeRequestModel
>(
  {
    card: { type: Schema.Types.ObjectId, ref: 'VirtualCard', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    status: { type: String, enum: CHARGE_REQUEST_STATUS, default: 'PENDING' },
    expiresAt: { type: Date, required: true },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

virtualCardChargeRequestSchema.index({ card: 1, status: 1 });

export const VirtualCardChargeRequest = model<
  IVirtualCardChargeRequest,
  VirtualCardChargeRequestModel
>('VirtualCardChargeRequest', virtualCardChargeRequestSchema);

const DEFAULT_WHATSAPP_TEMPLATE =
  "You've received a Zyara Prepaid Credit gift! Download the Zyara app and sign up with this number to claim it: {{link}}";

const virtualCardSettingsSchema = new Schema<
  IVirtualCardSettings,
  VirtualCardSettingsModel
>(
  {
    _id: { type: String, required: true },
    loadFeePercent: { type: Number, required: true, default: 5 },
    spendFeePercent: { type: Number, required: true, default: 2.5 },
    whatsappInviteMessageTemplate: {
      type: String,
      required: true,
      default: DEFAULT_WHATSAPP_TEMPLATE,
    },
  },
  { timestamps: true }
);

export const VirtualCardSettings = model<
  IVirtualCardSettings,
  VirtualCardSettingsModel
>('VirtualCardSettings', virtualCardSettingsSchema);

const cardNumberCounterSchema = new Schema<
  ICardNumberCounter,
  CardNumberCounterModel
>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CardNumberCounter = model<
  ICardNumberCounter,
  CardNumberCounterModel
>('CardNumberCounter', cardNumberCounterSchema);
