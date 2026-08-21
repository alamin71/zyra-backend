import { Model, Types } from 'mongoose';
import { ICartVariantSelection } from '../cart/cart.interface';

export const ORDER_MODES = ['DELIVERY', 'PICKUP'] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'ON_THE_WAY',
  'READY_FOR_PICKUP',
  'DELIVERED',
  'PICKED_UP',
  'CANCELED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['CASH', 'SYRIATEL_CASH', 'MTN_CASH'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type IOrderItem = {
  product: Types.ObjectId;
  name: string;
  image?: string;
  unitPrice: number;
  variantSelections: ICartVariantSelection[];
  specialRequest?: string;
  quantity: number;
  lineTotal: number;
};

export type IOrderAddressSnapshot = {
  label: string;
  street: string;
  floor?: string;
  instructions?: string;
  coordinates: [number, number];
};

export type IOrderPickupInfo = {
  storeName: string;
  addressText: string;
};

export type IOrder = {
  orderNumber: string;
  user: Types.ObjectId;
  store: Types.ObjectId;
  mode: OrderMode;
  items: IOrderItem[];
  address?: IOrderAddressSnapshot;
  pickupInfo?: IOrderPickupInfo;
  deliveryTiming: { type: 'ASAP' | 'SCHEDULED'; scheduledAt?: Date };
  substitutionPreference: 'CONTACT_ME' | 'SUBSTITUTE';
  arrivalPreference: { type: 'DO_NOT_RING' | 'CONTACT_ME'; note?: string };
  unavailableItemNote?: string;
  paymentMethod: PaymentMethod;
  voucher?: { code: string; discountAmount: number };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    grandTotal: number;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: Date }[];
  cancellation?: { reason: string; note?: string; at: Date };
  rating?: {
    stars: number;
    tags: string[];
    comment?: string;
    ratedAt: Date;
  };
};

export type OrderModel = Model<IOrder>;
