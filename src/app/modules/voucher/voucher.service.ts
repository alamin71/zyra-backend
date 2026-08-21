import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Cart } from '../cart/cart.model';
import { IVoucher } from './voucher.interface';
import { Voucher } from './voucher.model';

const createVoucherToDB = async (payload: Partial<IVoucher>) => {
  const existing = await Voucher.findOne({ code: payload.code });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, 'This voucher code already exists');
  }
  return Voucher.create(payload);
};

const getVouchersFromDB = async (query: Record<string, unknown>) => {
  const voucherQuery = new QueryBuilder(Voucher.find().lean(), query)
    .search(['code'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    voucherQuery.modelQuery,
    voucherQuery.countTotal(),
  ]);

  return { data, meta };
};

const getMyVouchersFromDB = async (userId: string) => {
  return Voucher.find({
    assignedTo: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$usedCount', '$maxUses'] },
  })
    .sort('-createdAt')
    .lean();
};

// Pure calculation, reused by the order module when the voucher is actually
// applied at checkout (not just previewed against the cart).
const calculateDiscount = (
  voucher: Pick<IVoucher, 'type' | 'value'>,
  subtotal: number,
  deliveryFee: number
): number => {
  switch (voucher.type) {
    case 'PERCENTAGE':
      return Math.round((subtotal * voucher.value) / 100);
    case 'FIXED':
      return Math.min(voucher.value, subtotal);
    case 'FREE_DELIVERY':
      return deliveryFee;
    default:
      return 0;
  }
};

const findApplicableVoucher = async (userId: string, code: string) => {
  const voucher = await Voucher.findOne({ code: code.trim().toUpperCase() });

  if (!voucher || !voucher.isActive) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid voucher code');
  }
  if (voucher.expiresAt < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This voucher has expired');
  }
  if (voucher.usedCount >= voucher.maxUses) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This voucher has already been used'
    );
  }
  if (voucher.assignedTo && voucher.assignedTo.toString() !== userId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This voucher is not assigned to your account'
    );
  }

  return voucher;
};

const previewVoucherForCartToDB = async (userId: string, code: string) => {
  const cart = await Cart.findOne({ user: userId }).populate<{
    store: { deliveryFee: number };
  }>('store', 'deliveryFee');
  if (!cart || cart.items.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your cart is empty');
  }

  const voucher = await findApplicableVoucher(userId, code);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const deliveryFee = cart.store.deliveryFee;
  const discountAmount = calculateDiscount(voucher, subtotal, deliveryFee);

  return {
    code: voucher.code,
    type: voucher.type,
    value: voucher.value,
    discountAmount,
    grandTotal: Math.max(subtotal + deliveryFee - discountAmount, 0),
  };
};

const redeemVoucherToDB = async (voucherId: string) => {
  await Voucher.findByIdAndUpdate(voucherId, { $inc: { usedCount: 1 } });
};

const deleteVoucherFromDB = async (id: string) => {
  const voucher = await Voucher.findByIdAndDelete(id);
  if (!voucher) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Voucher not found');
  }
  return voucher;
};

export const VoucherService = {
  createVoucherToDB,
  getVouchersFromDB,
  getMyVouchersFromDB,
  previewVoucherForCartToDB,
  findApplicableVoucher,
  calculateDiscount,
  redeemVoucherToDB,
  deleteVoucherFromDB,
};
