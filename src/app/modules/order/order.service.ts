import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Address } from '../address/address.model';
import { Cart } from '../cart/cart.model';
import { Store } from '../store/store.model';
import { StoreService } from '../store/store.service';
import { VoucherService } from '../voucher/voucher.service';
import {
  IOrderAddressSnapshot,
  IOrderPickupInfo,
  OrderStatus,
} from './order.interface';
import { Order } from './order.model';

// Only one forward step is ever valid from a given status — CONFIRMED forks
// depending on delivery vs pickup, everything else is a straight line.
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CONFIRMED'],
  CONFIRMED: ['ON_THE_WAY', 'READY_FOR_PICKUP'],
  ON_THE_WAY: ['DELIVERED'],
  READY_FOR_PICKUP: ['PICKED_UP'],
};

const generateOrderNumber = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  throw new AppError(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Could not generate a unique order number, please try again'
  );
};

type CheckoutPayload = {
  mode: 'DELIVERY' | 'PICKUP';
  addressId?: string;
  deliveryTiming?: { type: 'ASAP' | 'SCHEDULED'; scheduledAt?: Date };
  substitutionPreference?: 'CONTACT_ME' | 'SUBSTITUTE';
  arrivalPreference?: { type: 'DO_NOT_RING' | 'CONTACT_ME'; note?: string };
  unavailableItemNote?: string;
  paymentMethod?: 'CASH' | 'SYRIATEL_CASH' | 'MTN_CASH';
  voucherCode?: string;
};

const checkoutFromDB = async (userId: string, payload: CheckoutPayload) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your cart is empty');
  }

  const store = await Store.findOne({ _id: cart.store, isActive: true });
  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Store not found');
  }

  let address: IOrderAddressSnapshot | undefined;
  let pickupInfo: IOrderPickupInfo | undefined;

  if (payload.mode === 'DELIVERY') {
    if (!store.supportsDelivery) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This store does not offer delivery'
      );
    }
    const addressDoc = await Address.findOne({
      _id: payload.addressId,
      user: userId,
    });
    if (!addressDoc) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Address not found');
    }
    address = {
      label: addressDoc.label,
      street: addressDoc.street,
      floor: addressDoc.floor,
      instructions: addressDoc.instructions,
      coordinates: addressDoc.location.coordinates,
    };
  } else {
    if (!store.supportsPickup) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        'This store does not offer pickup'
      );
    }
    pickupInfo = { storeName: store.name, addressText: store.addressText };
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  if (subtotal < store.minOrderAmount) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Minimum order amount is ${store.minOrderAmount} SYP, add items worth ${
        store.minOrderAmount - subtotal
      } SYP more to proceed`
    );
  }

  const deliveryFee = payload.mode === 'PICKUP' ? 0 : store.deliveryFee;

  let voucher: { code: string; discountAmount: number } | undefined;
  let discount = 0;
  let voucherDoc;

  if (payload.voucherCode) {
    voucherDoc = await VoucherService.findApplicableVoucher(
      userId,
      payload.voucherCode
    );
    discount = VoucherService.calculateDiscount(voucherDoc, subtotal, deliveryFee);
    voucher = { code: voucherDoc.code, discountAmount: discount };
  }

  const tax = 0;
  const grandTotal = Math.max(subtotal + deliveryFee + tax - discount, 0);

  const orderNumber = await generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: userId,
    store: store._id,
    mode: payload.mode,
    items: cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      unitPrice: item.unitPrice,
      variantSelections: item.variantSelections,
      specialRequest: item.specialRequest,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity,
    })),
    address,
    pickupInfo,
    deliveryTiming: payload.deliveryTiming ?? { type: 'ASAP' },
    substitutionPreference: payload.substitutionPreference ?? 'CONTACT_ME',
    arrivalPreference: payload.arrivalPreference ?? { type: 'DO_NOT_RING' },
    unavailableItemNote: payload.unavailableItemNote,
    paymentMethod: payload.paymentMethod ?? 'CASH',
    voucher,
    pricing: { subtotal, deliveryFee, tax, discount, grandTotal },
    status: 'PENDING',
    statusHistory: [{ status: 'PENDING', at: new Date() }],
  });

  if (voucherDoc) {
    await VoucherService.redeemVoucherToDB(voucherDoc._id.toString());
  }

  await cart.deleteOne();

  return order;
};

const getMyOrdersFromDB = async (userId: string, query: Record<string, unknown>) => {
  const orderQuery = new QueryBuilder(
    Order.find({ user: userId }).populate('store', 'name logo').lean(),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    orderQuery.modelQuery,
    orderQuery.countTotal(),
  ]);

  return { data, meta };
};

const getOwnedOrder = async (userId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).populate(
    'store',
    'name logo'
  );
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  }
  return order;
};

const getMyOrderByIdFromDB = async (userId: string, orderId: string) => {
  return getOwnedOrder(userId, orderId);
};

const cancelMyOrderToDB = async (
  userId: string,
  orderId: string,
  payload: { reason: string; note?: string }
) => {
  const order = await getOwnedOrder(userId, orderId);

  if (order.status !== 'PENDING') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Only a pending order can be canceled'
    );
  }

  order.status = 'CANCELED';
  order.cancellation = { ...payload, at: new Date() };
  order.statusHistory.push({ status: 'CANCELED', at: new Date() });
  await order.save();

  return order;
};

const rateMyOrderToDB = async (
  userId: string,
  orderId: string,
  payload: { stars: number; tags?: string[]; comment?: string }
) => {
  const order = await getOwnedOrder(userId, orderId);

  if (!['DELIVERED', 'PICKED_UP'].includes(order.status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Only a completed order can be rated'
    );
  }
  if (order.rating) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This order was already rated');
  }

  order.rating = {
    stars: payload.stars,
    tags: payload.tags ?? [],
    comment: payload.comment,
    ratedAt: new Date(),
  };
  await order.save();

  const store = await Store.findById(order.store);
  if (store) {
    const newCount = store.rating.count + 1;
    const newAvg = (store.rating.avg * store.rating.count + payload.stars) / newCount;
    store.rating = { avg: Math.round(newAvg * 10) / 10, count: newCount };
    await store.save();
  }

  return order;
};

// Refills the cart with the same items so checkout can be redone quickly —
// prices/names are taken from the original order snapshot, not re-priced
// against the live catalog.
const reorderToDB = async (userId: string, orderId: string) => {
  const order = await getOwnedOrder(userId, orderId);

  await Cart.findOneAndDelete({ user: userId });

  const cart = await Cart.create({
    user: userId,
    store: order.store,
    items: order.items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      unitPrice: item.unitPrice,
      variantSelections: item.variantSelections,
      specialRequest: item.specialRequest,
      quantity: item.quantity,
    })),
  });

  return cart;
};

// ----- Vendor panel -----

const getStoreOrdersFromDB = async (
  ownerId: string,
  query: Record<string, unknown>
) => {
  const store = await StoreService.getStoreOwnedByVendor(ownerId);

  const orderQuery = new QueryBuilder(
    Order.find({ store: store._id }).populate('user', 'name phone').lean(),
    query
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    orderQuery.modelQuery,
    orderQuery.countTotal(),
  ]);

  return { data, meta };
};

const updateOrderStatusToDB = async (
  ownerId: string,
  orderId: string,
  nextStatus: OrderStatus
) => {
  const store = await StoreService.getStoreOwnedByVendor(ownerId);

  const order = await Order.findOne({ _id: orderId, store: store._id });
  if (!order) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  const allowedNext = NEXT_STATUS[order.status] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot move an order from ${order.status} to ${nextStatus}`
    );
  }

  const isDeliveryStep = nextStatus === 'ON_THE_WAY' || nextStatus === 'DELIVERED';
  const isPickupStep = nextStatus === 'READY_FOR_PICKUP' || nextStatus === 'PICKED_UP';
  if (
    (isDeliveryStep && order.mode !== 'DELIVERY') ||
    (isPickupStep && order.mode !== 'PICKUP')
  ) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This order is ${order.mode.toLowerCase()} and cannot move to ${nextStatus}`
    );
  }

  order.status = nextStatus;
  order.statusHistory.push({ status: nextStatus, at: new Date() });
  await order.save();

  return order;
};

export const OrderService = {
  checkoutFromDB,
  getMyOrdersFromDB,
  getMyOrderByIdFromDB,
  cancelMyOrderToDB,
  rateMyOrderToDB,
  reorderToDB,
  getStoreOrdersFromDB,
  updateOrderStatusToDB,
};
