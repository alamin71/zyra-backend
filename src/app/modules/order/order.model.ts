import { model, Schema } from 'mongoose';
import {
  IOrder,
  ORDER_MODES,
  ORDER_STATUSES,
  OrderModel,
  PAYMENT_METHODS,
} from './order.interface';

const variantSelectionSchema = {
  groupName: { type: String, required: true },
  optionLabel: { type: String, required: true },
  priceModifier: { type: Number, default: 0 },
};

const orderSchema = new Schema<IOrder, OrderModel>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    mode: {
      type: String,
      enum: ORDER_MODES,
      required: true,
    },
    items: {
      type: [
        {
          product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
          name: { type: String, required: true },
          image: { type: String },
          unitPrice: { type: Number, required: true },
          variantSelections: { type: [variantSelectionSchema], default: [] },
          specialRequest: { type: String, trim: true },
          quantity: { type: Number, required: true, min: 1 },
          lineTotal: { type: Number, required: true },
        },
      ],
      required: true,
    },
    address: {
      label: { type: String },
      street: { type: String },
      floor: { type: String },
      instructions: { type: String },
      coordinates: { type: [Number] },
    },
    pickupInfo: {
      storeName: { type: String },
      addressText: { type: String },
    },
    deliveryTiming: {
      type: {
        type: String,
        enum: ['ASAP', 'SCHEDULED'],
        default: 'ASAP',
      },
      scheduledAt: { type: Date },
    },
    substitutionPreference: {
      type: String,
      enum: ['CONTACT_ME', 'SUBSTITUTE'],
      default: 'CONTACT_ME',
    },
    arrivalPreference: {
      type: {
        type: String,
        enum: ['DO_NOT_RING', 'CONTACT_ME'],
        default: 'DO_NOT_RING',
      },
      note: { type: String, trim: true },
    },
    unavailableItemNote: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'CASH',
    },
    voucher: {
      code: { type: String },
      discountAmount: { type: Number },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      deliveryFee: { type: Number, required: true },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      grandTotal: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'PENDING',
    },
    statusHistory: {
      type: [
        {
          status: { type: String, enum: ORDER_STATUSES, required: true },
          at: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    cancellation: {
      reason: { type: String },
      note: { type: String },
      at: { type: Date },
    },
    rating: {
      stars: { type: Number, min: 1, max: 5 },
      tags: { type: [String], default: [] },
      comment: { type: String, trim: true },
      ratedAt: { type: Date },
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ store: 1, status: 1 });

export const Order = model<IOrder, OrderModel>('Order', orderSchema);
