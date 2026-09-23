import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { smsHelper } from '../../../helpers/smsHelper';
import { stripeHelper } from '../../../helpers/stripeHelper';
import QueryBuilder from '../../builder/QueryBuilder';
import { Store } from '../store/store.model';
import { User } from '../user/user.model';
import { VIRTUAL_CARD_VALIDITY_MONTHS } from './virtualCard.interface';
import {
  CardNumberCounter,
  VirtualCard,
  VirtualCardChargeRequest,
  VirtualCardPendingGift,
  VirtualCardSettings,
  VirtualCardTransaction,
} from './virtualCard.model';

const CHARGE_APPROVAL_TTL_MS = 3 * 60 * 1000; // client-confirmed: 3 minutes
const CARD_NUMBER_LENGTH = 16;
const FAMILY_RESERVED_UPTO = 10; // cards 0001-0010 reserved, auto numbering starts at 11

const newExpiry = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + VIRTUAL_CARD_VALIDITY_MONTHS);
  return d;
};

const recordTransaction = async (params: {
  card: string;
  type:
    | 'LOAD'
    | 'TRANSFER_SENT'
    | 'TRANSFER_RECEIVED'
    | 'SPEND'
    | 'REFUND';
  amount: number;
  balanceAfter: number;
  relatedUser?: string;
  store?: string;
  note?: string;
}) => VirtualCardTransaction.create(params);

// ---- Settings (admin-controlled fees + WhatsApp template) ----

const SETTINGS_ID = 'virtual-card-settings';

const getSettings = async () => {
  const existing = await VirtualCardSettings.findById(SETTINGS_ID);
  if (existing) {
    return existing;
  }
  return VirtualCardSettings.create({ _id: SETTINGS_ID });
};

const getSettingsFromDB = async () => getSettings();

const updateSettingsToDB = async (payload: {
  loadFeePercent?: number;
  spendFeePercent?: number;
  whatsappInviteMessageTemplate?: string;
}) => {
  await getSettings();
  const updated = await VirtualCardSettings.findByIdAndUpdate(
    SETTINGS_ID,
    payload,
    { new: true }
  );
  return updated;
};

// ---- Card numbering ----

const formatCardNumber = (raw: string) =>
  raw.replace(/(\d{4})(?=\d)/g, '$1 ');

const nextCardNumberSeq = async (): Promise<number> => {
  let counter = await CardNumberCounter.findById('virtualCardNumber');
  if (!counter) {
    try {
      counter = await CardNumberCounter.create({
        _id: 'virtualCardNumber',
        seq: FAMILY_RESERVED_UPTO,
      });
    } catch {
      // Another request created it first — fine, just re-read below.
    }
  }

  const updated = await CardNumberCounter.findByIdAndUpdate(
    'virtualCardNumber',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return updated!.seq;
};

const generateCardNumber = async (): Promise<string> => {
  const seq = await nextCardNumberSeq();
  return seq.toString().padStart(CARD_NUMBER_LENGTH, '0');
};

// Every user gets exactly one permanent card, created the first time they
// need one (their own first load, or claiming a gift). Top-ups and further
// gifts reuse the same card/number for life.
const getOrCreateCardForUser = async (userId: string) => {
  let card = await VirtualCard.findOne({ owner: userId });
  if (card) {
    return card;
  }

  const cardNumber = await generateCardNumber();
  card = await VirtualCard.create({
    owner: userId,
    cardNumber,
    balance: 0,
    status: 'ACTIVE',
    expiresAt: newExpiry(),
  });
  return card;
};

// ---- Read ----

const getMyCardFromDB = async (userId: string) => {
  const card = await getOrCreateCardForUser(userId);
  return { ...card.toObject(), formattedCardNumber: formatCardNumber(card.cardNumber) };
};

const getMyTransactionsFromDB = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const card = await getOrCreateCardForUser(userId);

  const txQuery = new QueryBuilder(
    VirtualCardTransaction.find({ card: card._id }).lean(),
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

// ---- Check recipient (drives the "not registered, invite?" prompt) ----

const checkRecipientFromDB = async (phone: string) => {
  const user = await User.findOne({ phone });
  if (!user) {
    return { registered: false as const };
  }
  return { registered: true as const, name: user.name };
};

// ---- Send credit (the primary purchase flow — sender pays, recipient's
// permanent card is credited, or a pending gift is held if unregistered) ----

const sendCreditToDB = async (
  senderId: string,
  amount: number,
  recipientPhone: string
) => {
  const settings = await getSettings();
  const chargeAmount = amount * (1 + settings.loadFeePercent / 100);

  const charge = await stripeHelper.chargeForLoad(chargeAmount, {
    senderId,
    recipientPhone,
    purpose: 'virtual-card-send',
  });

  if (charge.status !== 'succeeded') {
    return { requiresAction: true, clientSecret: charge.clientSecret };
  }

  const recipientUser = await User.findOne({ phone: recipientPhone });

  if (recipientUser) {
    const card = await getOrCreateCardForUser(recipientUser._id.toString());
    card.balance += amount;
    await card.save();

    await recordTransaction({
      card: card._id.toString(),
      type: 'LOAD',
      amount,
      balanceAfter: card.balance,
      relatedUser: senderId,
      note: `Credit purchased by sender, Stripe charge $${chargeAmount.toFixed(2)} (incl. ${settings.loadFeePercent}% fee), payment intent ${charge.paymentIntentId}`,
    });

    const message = `You've received a $${amount} Zyara Prepaid Credit! Open the Zyara app to see your balance.`;
    await smsHelper.sendWhatsAppMessage(recipientPhone, message).catch(() => undefined);

    return { requiresAction: false, delivered: true, card };
  }

  // Not registered — hold the money as a pending gift and invite them.
  const pendingGift = await VirtualCardPendingGift.create({
    fromUser: senderId,
    toPhone: recipientPhone,
    amount,
    status: 'PENDING',
  });

  const inviteMessage = settings.whatsappInviteMessageTemplate.replace(
    '{{link}}',
    `${process.env.BACKEND_URL || ''}/download`
  );
  await smsHelper.sendWhatsAppMessage(recipientPhone, inviteMessage).catch(() => undefined);

  return { requiresAction: false, delivered: false, pendingGift };
};

// ---- Pending gift claim (after the invited phone number registers) ----

const getIncomingPendingGiftsFromDB = async (phone: string) => {
  return VirtualCardPendingGift.find({ toPhone: phone, status: 'PENDING' })
    .sort('-createdAt')
    .lean();
};

const claimPendingGiftToDB = async (
  userId: string,
  userPhone: string,
  giftId: string
) => {
  const gift = await VirtualCardPendingGift.findById(giftId);
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

  const card = await getOrCreateCardForUser(userId);
  card.balance += gift.amount;
  await card.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'LOAD',
    amount: gift.amount,
    balanceAfter: card.balance,
    relatedUser: gift.fromUser.toString(),
    note: 'Claimed pending gift',
  });

  gift.status = 'CLAIMED';
  gift.claimedCard = card._id;
  gift.claimedAt = new Date();
  await gift.save();

  return { gift, card };
};

// ---- Transfer (recipient re-distributes balance they already hold, to
// another REGISTERED user — no invite flow here per the client's deck) ----

const transferBalanceToDB = async (
  userId: string,
  recipientPhone: string,
  amount: number
) => {
  const card = await getOrCreateCardForUser(userId);
  if (card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your card is not active');
  }
  if (card.balance < amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  const recipientUser = await User.findOne({ phone: recipientPhone });
  if (!recipientUser) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      'Recipient must be a registered Zyara user to receive a transfer'
    );
  }
  if (recipientUser._id.equals(userId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot transfer to yourself');
  }

  const recipientCard = await getOrCreateCardForUser(recipientUser._id.toString());

  card.balance -= amount;
  await card.save();
  recipientCard.balance += amount;
  await recipientCard.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'TRANSFER_SENT',
    amount: -amount,
    balanceAfter: card.balance,
    relatedUser: recipientUser._id.toString(),
    note: `Transferred to ${recipientPhone}`,
  });
  await recordTransaction({
    card: recipientCard._id.toString(),
    type: 'TRANSFER_RECEIVED',
    amount,
    balanceAfter: recipientCard.balance,
    relatedUser: userId,
    note: 'Received transfer',
  });

  const message = `You've received a $${amount} transfer on your Zyara Prepaid Credit card.`;
  await smsHelper.sendWhatsAppMessage(recipientPhone, message).catch(() => undefined);

  return card;
};

// ---- Spend: merchant creates a charge request, cardholder approves ----

const createChargeRequestToDB = async (
  vendorUserId: string,
  cardNumberInput: string,
  amount: number
) => {
  const cardNumber = cardNumberInput.replace(/\s+/g, '');
  const card = await VirtualCard.findOne({ cardNumber });
  if (!card) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Card not found');
  }
  if (card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This card is not active');
  }
  // Validated server-side only — the merchant response never includes the
  // actual balance, per the client's privacy requirement.
  if (card.balance < amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This card cannot cover the requested amount');
  }

  const store = await Store.findOne({ owner: vendorUserId });
  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, "You don't have a store");
  }

  const request = await VirtualCardChargeRequest.create({
    card: card._id,
    store: store._id,
    amount,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + CHARGE_APPROVAL_TTL_MS),
  });

  const owner = await User.findById(card.owner);
  if (owner?.phone) {
    await smsHelper
      .sendWhatsAppMessage(
        owner.phone,
        `${store.name} is requesting a charge of $${amount} on your Zyara Prepaid Credit card. Open the app to approve or decline (expires in 3 minutes).`
      )
      .catch(() => undefined);
  }

  return { requestId: request._id, status: request.status, expiresAt: request.expiresAt };
};

const expireIfPastDue = async (
  request: InstanceType<typeof VirtualCardChargeRequest>
) => {
  if (request.status === 'PENDING' && request.expiresAt < new Date()) {
    request.status = 'EXPIRED';
    request.respondedAt = new Date();
    await request.save();
  }
  return request;
};

// Merchant polls this — deliberately never returns the card's balance.
const getChargeRequestStatusFromDB = async (
  vendorUserId: string,
  requestId: string
) => {
  const store = await Store.findOne({ owner: vendorUserId });
  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, "You don't have a store");
  }

  let request = await VirtualCardChargeRequest.findOne({
    _id: requestId,
    store: store._id,
  });
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Charge request not found');
  }

  request = await expireIfPastDue(request);

  return {
    requestId: request._id,
    status: request.status,
    amount: request.amount,
    expiresAt: request.expiresAt,
  };
};

const getPendingChargeRequestsFromDB = async (userId: string) => {
  const card = await getOrCreateCardForUser(userId);

  const requests = await VirtualCardChargeRequest.find({
    card: card._id,
    status: 'PENDING',
  })
    .populate('store', 'name logo')
    .sort('-createdAt');

  const stillPending = [];
  for (const request of requests) {
    const updated = await expireIfPastDue(request);
    if (updated.status === 'PENDING') {
      stillPending.push(updated);
    }
  }
  return stillPending;
};

const respondToChargeRequestToDB = async (
  userId: string,
  requestId: string,
  approve: boolean
) => {
  const card = await getOrCreateCardForUser(userId);

  let request = await VirtualCardChargeRequest.findOne({
    _id: requestId,
    card: card._id,
  });
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Charge request not found');
  }

  request = await expireIfPastDue(request);
  if (request.status !== 'PENDING') {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This request already ${request.status.toLowerCase()}`
    );
  }

  if (!approve) {
    request.status = 'DECLINED';
    request.respondedAt = new Date();
    await request.save();
    return request;
  }

  if (card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your card is not active');
  }
  if (card.balance < request.amount) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  const settings = await getSettings();
  // The fee comes out of the merchant's payout, not the cardholder's
  // balance — the client's deck shows the remaining balance as
  // starting − purchase only, with the fee called out separately.
  const merchantPayout = request.amount * (1 - settings.spendFeePercent / 100);

  card.balance -= request.amount;
  await card.save();

  request.status = 'APPROVED';
  request.respondedAt = new Date();
  await request.save();

  await recordTransaction({
    card: card._id.toString(),
    type: 'SPEND',
    amount: -request.amount,
    balanceAfter: card.balance,
    store: request.store.toString(),
    note: `Approved purchase — merchant paid out $${merchantPayout.toFixed(2)} after ${settings.spendFeePercent}% fee`,
  });

  return request;
};

// ---- Admin ----

const getAllCardsFromDB = async (query: Record<string, unknown>) => {
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

// One-time manual issuance for the client's own first 10 (family) cards,
// bypassing the auto-counter so specific low numbers can be assigned.
const issueCardToDB = async (userId: string, cardNumberInput: string) => {
  const existing = await VirtualCard.findOne({ owner: userId });
  if (existing) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This user already has a card');
  }

  const cardNumber = cardNumberInput
    .replace(/\s+/g, '')
    .padStart(CARD_NUMBER_LENGTH, '0');

  const clash = await VirtualCard.findOne({ cardNumber });
  if (clash) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This card number is already in use');
  }

  return VirtualCard.create({
    owner: userId,
    cardNumber,
    balance: 0,
    status: 'ACTIVE',
    expiresAt: newExpiry(),
  });
};

// No automatic Stripe refund — a card's balance can come from a load, a
// transfer, or a claimed gift, so there's no single payment to cleanly
// refund. This flags expired balances and zeroes them; the card itself
// (and its number) stays active for future top-ups.
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
  getSettingsFromDB,
  updateSettingsToDB,
  getMyCardFromDB,
  getMyTransactionsFromDB,
  checkRecipientFromDB,
  sendCreditToDB,
  getIncomingPendingGiftsFromDB,
  claimPendingGiftToDB,
  transferBalanceToDB,
  createChargeRequestToDB,
  getChargeRequestStatusFromDB,
  getPendingChargeRequestsFromDB,
  respondToChargeRequestToDB,
  getAllCardsFromDB,
  issueCardToDB,
  processExpiredCardsToDB,
};
