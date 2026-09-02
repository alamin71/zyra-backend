import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { stripeHelper } from '../../../helpers/stripeHelper';
import { smsHelper } from '../../../helpers/smsHelper';
import generateOTP from '../../../utils/generateOTP';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import { Store } from '../store/store.model';
import {
  PLATFORM_FEE_PERCENT,
  VIRTUAL_CARD_VALIDITY_MONTHS,
} from './virtualCard.interface';
import {
  VirtualCard,
  VirtualCardGift,
  VirtualCardRedemption,
  VirtualCardTransaction,
} from './virtualCard.model';

const REDEMPTION_CODE_TTL_MS = 5 * 60 * 1000;

const newExpiry = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + VIRTUAL_CARD_VALIDITY_MONTHS);
  return d;
};

const recordTransaction = async (params: {
  card: string;
  type: 'LOAD' | 'TOP_UP' | 'GIFT_SENT' | 'GIFT_RECEIVED' | 'SPEND' | 'REFUND';
  amount: number;
  balanceAfter: number;
  relatedUser?: string;
  store?: string;
  note?: string;
}) => VirtualCardTransaction.create(params);

const getOwnedActiveCard = async (userId: string, cardId: string) => {
  const card = await VirtualCard.findOne({ _id: cardId, owner: userId });
  if (!card) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Virtual card not found');
  }
  if (card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, `Card is ${card.status.toLowerCase()}`);
  }
  return card;
};

// ---- Load / Top-up ----

const loadVirtualCardToDB = async (userId: string, amount: number) => {
  const chargeAmount = amount * (1 + PLATFORM_FEE_PERCENT / 100);
  const charge = await stripeHelper.chargeForLoad(chargeAmount, {
    userId,
    purpose: 'virtual-card-load',
  });

  if (charge.status !== 'succeeded') {
    return { requiresAction: true, clientSecret: charge.clientSecret };
  }

  const card = await VirtualCard.create({
    owner: userId,
    balance: amount,
    status: 'ACTIVE',
    expiresAt: newExpiry(),
  });

  await recordTransaction({
    card: card._id.toString(),
    type: 'LOAD',
    amount,
    balanceAfter: card.balance,
    note: `Stripe charge $${chargeAmount.toFixed(2)} (incl. ${PLATFORM_FEE_PERCENT}% platform fee), payment intent ${charge.paymentIntentId}`,
  });

  return { requiresAction: false, card };
};

const topUpVirtualCardToDB = async (
  userId: string,
  cardId: string,
  amount: number
) => {
  const card = await getOwnedActiveCard(userId, cardId);

  const chargeAmount = amount * (1 + PLATFORM_FEE_PERCENT / 100);
  const charge = await stripeHelper.chargeForLoad(chargeAmount, {
    userId,
    cardId,
    purpose: 'virtual-card-topup',
  });

  if (charge.status !== 'succeeded') {
    return { requiresAction: true, clientSecret: charge.clientSecret };
  }

  card.balance += amount;
  await card.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'TOP_UP',
    amount,
    balanceAfter: card.balance,
    note: `Stripe charge $${chargeAmount.toFixed(2)} (incl. ${PLATFORM_FEE_PERCENT}% platform fee), payment intent ${charge.paymentIntentId}`,
  });

  return { requiresAction: false, card };
};

// ---- Read ----

const getMyVirtualCardsFromDB = async (userId: string) => {
  return VirtualCard.find({ owner: userId }).sort('-createdAt').lean();
};

const getVirtualCardByIdFromDB = async (userId: string, cardId: string) => {
  const card = await VirtualCard.findOne({ _id: cardId, owner: userId }).lean();
  if (!card) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Virtual card not found');
  }
  return card;
};

const getCardTransactionsFromDB = async (
  userId: string,
  cardId: string,
  query: Record<string, unknown>
) => {
  await getVirtualCardByIdFromDB(userId, cardId);

  const txQuery = new QueryBuilder(
    VirtualCardTransaction.find({ card: cardId }).lean(),
    { sort: '-createdAt', ...query }
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    txQuery.modelQuery,
    txQuery.countTotal(),
  ]);

  return { data, meta };
};

// ---- Gifting ----

const giftVirtualCardToDB = async (
  userId: string,
  cardId: string,
  recipientPhone: string,
  amount: number
) => {
  const card = await getOwnedActiveCard(userId, cardId);

  if (card.balance < amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  card.balance -= amount;
  await card.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'GIFT_SENT',
    amount: -amount,
    balanceAfter: card.balance,
    note: `Gifted to ${recipientPhone}`,
  });

  const recipientUser = await User.findOne({ phone: recipientPhone });

  const gift = await VirtualCardGift.create({
    sourceCard: card._id,
    fromUser: userId,
    toPhone: recipientPhone,
    toUser: recipientUser?._id,
    amount,
    status: 'PENDING',
  });

  const message = `You've received a $${amount} Zyara Virtual Card gift! Open the Zyara app to claim it.`;
  if (recipientUser) {
    // Push notification delivery is pending the Notification module — SMS/WhatsApp is the reliable channel available today.
    await smsHelper.sendWhatsAppMessage(recipientPhone, message).catch(() => undefined);
  } else {
    await smsHelper
      .sendWhatsAppMessage(
        recipientPhone,
        `${message} Download Zyara to get started.`
      )
      .catch(() => undefined);
  }

  return gift;
};

const getOwnedPendingGift = async (userId: string, giftId: string) => {
  const gift = await VirtualCardGift.findOne({ _id: giftId, fromUser: userId });
  if (!gift) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Gift not found');
  }
  if (gift.status !== 'PENDING') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This gift was already ${gift.status.toLowerCase()}`
    );
  }
  return gift;
};

const modifyGiftToDB = async (
  userId: string,
  giftId: string,
  newAmount: number
) => {
  const gift = await getOwnedPendingGift(userId, giftId);
  const card = await VirtualCard.findById(gift.sourceCard);
  if (!card) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Source card not found');
  }

  const difference = newAmount - gift.amount;
  if (difference > 0 && card.balance < difference) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  card.balance -= difference;
  await card.save();
  gift.amount = newAmount;
  await gift.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'GIFT_SENT',
    amount: -difference,
    balanceAfter: card.balance,
    note: `Adjusted gift to ${gift.toPhone} to $${newAmount}`,
  });

  return gift;
};

const cancelGiftToDB = async (userId: string, giftId: string) => {
  const gift = await getOwnedPendingGift(userId, giftId);
  const card = await VirtualCard.findById(gift.sourceCard);
  if (!card) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Source card not found');
  }

  card.balance += gift.amount;
  await card.save();

  gift.status = 'CANCELLED';
  gift.cancelledAt = new Date();
  await gift.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'REFUND',
    amount: gift.amount,
    balanceAfter: card.balance,
    note: `Cancelled gift to ${gift.toPhone}`,
  });

  return gift;
};

const getIncomingGiftsFromDB = async (phone: string) => {
  return VirtualCardGift.find({ toPhone: phone, status: 'PENDING' })
    .sort('-createdAt')
    .lean();
};

const claimGiftToDB = async (userId: string, userPhone: string, giftId: string) => {
  const gift = await VirtualCardGift.findById(giftId);
  if (!gift) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Gift not found');
  }
  if (gift.status !== 'PENDING') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This gift was already ${gift.status.toLowerCase()}`
    );
  }
  if (gift.toPhone !== userPhone) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'This gift was not sent to your phone number'
    );
  }

  const newCard = await VirtualCard.create({
    owner: userId,
    balance: gift.amount,
    status: 'ACTIVE',
    expiresAt: newExpiry(),
  });

  await recordTransaction({
    card: newCard._id.toString(),
    type: 'GIFT_RECEIVED',
    amount: gift.amount,
    balanceAfter: newCard.balance,
    relatedUser: gift.fromUser.toString(),
    note: 'Claimed gift',
  });

  gift.status = 'CLAIMED';
  gift.toUser = newCard.owner;
  gift.claimedCard = newCard._id;
  gift.claimedAt = new Date();
  await gift.save();

  return { gift, card: newCard };
};

// ---- Spend at vendor (masked/tokenized — vendor never sees the card itself) ----

const generateRedemptionCodeToDB = async (userId: string, cardId: string) => {
  await getOwnedActiveCard(userId, cardId);

  let code = generateOTP(6);
  // Astronomically unlikely to collide, but guard anyway since code is unique-indexed.
  while (await VirtualCardRedemption.findOne({ code, status: 'ACTIVE' })) {
    code = generateOTP(6);
  }

  const redemption = await VirtualCardRedemption.create({
    card: cardId,
    code,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + REDEMPTION_CODE_TTL_MS),
  });

  return redemption;
};

const redeemCodeToDB = async (vendorUserId: string, code: string, amount: number) => {
  const redemption = await VirtualCardRedemption.findOne({ code });
  if (!redemption) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Invalid or expired code');
  }
  if (redemption.status !== 'ACTIVE' || redemption.expiresAt < new Date()) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This code is no longer valid');
  }

  const card = await VirtualCard.findById(redemption.card);
  if (!card || card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This card is not active');
  }
  if (card.balance < amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  const store = await Store.findOne({ owner: vendorUserId });
  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, "You don't have a store");
  }

  card.balance -= amount;
  await card.save();

  redemption.status = 'USED';
  redemption.usedAt = new Date();
  redemption.usedAmount = amount;
  redemption.store = store._id;
  await redemption.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'SPEND',
    amount: -amount,
    balanceAfter: card.balance,
    store: store._id.toString(),
    note: `Spent at ${store.name}`,
  });

  return { charged: amount, remainingBalance: card.balance, store: store.name };
};

// ---- Admin ----

const getAllVirtualCardsFromDB = async (query: Record<string, unknown>) => {
  const cardQuery = new QueryBuilder(VirtualCard.find().lean(), {
    sort: '-createdAt',
    ...query,
  })
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    cardQuery.modelQuery,
    cardQuery.countTotal(),
  ]);

  return { data, meta };
};

// No automatic Stripe refund here — a card's balance can come from a load,
// several top-ups, or a claimed gift (which was never itself charged), so
// there's no single payment to cleanly refund via the API. This flags
// expired cards and zeroes them out; actual money-back to the user is a
// manual finance step until the client defines a real refund mechanism.
const processExpiredCardsToDB = async () => {
  const expiredCards = await VirtualCard.find({
    status: 'ACTIVE',
    expiresAt: { $lt: new Date() },
    balance: { $gt: 0 },
  });

  const results = [];
  for (const card of expiredCards) {
    const refundAmount = card.balance;
    card.balance = 0;
    card.status = 'EXPIRED';
    await card.save();

    await recordTransaction({
      card: card._id.toString(),
      type: 'REFUND',
      amount: -refundAmount,
      balanceAfter: 0,
      note: 'Expired — flagged for manual refund processing',
    });

    results.push({ cardId: card._id, owner: card.owner, refundAmount });
  }

  return results;
};

export const VirtualCardService = {
  loadVirtualCardToDB,
  topUpVirtualCardToDB,
  getMyVirtualCardsFromDB,
  getVirtualCardByIdFromDB,
  getCardTransactionsFromDB,
  giftVirtualCardToDB,
  modifyGiftToDB,
  cancelGiftToDB,
  getIncomingGiftsFromDB,
  claimGiftToDB,
  generateRedemptionCodeToDB,
  redeemCodeToDB,
  getAllVirtualCardsFromDB,
  processExpiredCardsToDB,
};
