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
  const card = await VirtualCard.findOne({ owner: userId });
  if (card) {
    return card;
  }

  const cardNumber = await generateCardNumber();
  try {
    return await VirtualCard.create({
      owner: userId,
      cardNumber,
      balance: 0,
      status: 'ACTIVE',
      expiresAt: newExpiry(),
    });
  } catch (err) {
    // Two concurrent first-time requests (e.g. the app firing GET /me and
    // GET /me/transactions together) can both reach here before either
    // insert commits — the `owner` unique index rejects the loser, so
    // re-fetch instead of crashing.
    if ((err as { code?: number }).code === 11000) {
      const existing = await VirtualCard.findOne({ owner: userId });
      if (existing) {
        return existing;
      }
    }
    throw err;
  }
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
    // $inc is atomic per-document, so two sends landing on the same
    // recipient at once can't lose one of the credits the way a
    // read-modify-write (card.balance += amount; card.save()) would.
    const credited = await VirtualCard.findOneAndUpdate(
      { _id: card._id },
      { $inc: { balance: amount } },
      { new: true }
    );

    await recordTransaction({
      card: card._id.toString(),
      type: 'LOAD',
      amount,
      balanceAfter: credited!.balance,
      relatedUser: senderId,
      note: `Credit purchased by sender, Stripe charge $${chargeAmount.toFixed(2)} (incl. ${settings.loadFeePercent}% fee), payment intent ${charge.paymentIntentId}`,
    });

    const message = `You've received a $${amount} Zyara Prepaid Credit! Open the Zyara app to see your balance.`;
    await smsHelper.sendWhatsAppMessage(recipientPhone, message).catch(() => undefined);

    return { requiresAction: false, delivered: true, card: credited };
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
  if (gift.toPhone !== userPhone) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'This gift was not sent to your phone number'
    );
  }

  const card = await getOrCreateCardForUser(userId);

  // Atomic claim: only one of two near-simultaneous "claim" taps can flip
  // this from PENDING to CLAIMED, so the card only ever gets credited once.
  const claimed = await VirtualCardPendingGift.findOneAndUpdate(
    { _id: giftId, status: 'PENDING' },
    { status: 'CLAIMED', claimedCard: card._id, claimedAt: new Date() },
    { new: true }
  );
  if (!claimed) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This gift was already ${gift.status.toLowerCase()}`
    );
  }

  const updatedCard = await VirtualCard.findOneAndUpdate(
    { _id: card._id },
    { $inc: { balance: gift.amount } },
    { new: true }
  );

  await recordTransaction({
    card: card._id.toString(),
    type: 'LOAD',
    amount: gift.amount,
    balanceAfter: updatedCard!.balance,
    relatedUser: gift.fromUser.toString(),
    note: 'Claimed pending gift',
  });

  return { gift: claimed, card: updatedCard };
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

  // Atomic debit: balance check + deduction in one operation, so two
  // concurrent transfers/spends off the same card can't both pass a stale
  // balance check.
  const debited = await VirtualCard.findOneAndUpdate(
    { _id: card._id, status: 'ACTIVE', balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!debited) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  const credited = await VirtualCard.findOneAndUpdate(
    { _id: recipientCard._id },
    { $inc: { balance: amount } },
    { new: true }
  );

  await recordTransaction({
    card: debited._id.toString(),
    type: 'TRANSFER_SENT',
    amount: -amount,
    balanceAfter: debited.balance,
    relatedUser: recipientUser._id.toString(),
    note: `Transferred to ${recipientPhone}`,
  });
  await recordTransaction({
    card: credited!._id.toString(),
    type: 'TRANSFER_RECEIVED',
    amount,
    balanceAfter: credited!.balance,
    relatedUser: userId,
    note: 'Received transfer',
  });

  const message = `You've received a $${amount} transfer on your Zyara Prepaid Credit card.`;
  await smsHelper.sendWhatsAppMessage(recipientPhone, message).catch(() => undefined);

  return debited;
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

  const request = await VirtualCardChargeRequest.findOne({
    _id: requestId,
    card: card._id,
  });
  if (!request) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Charge request not found');
  }

  await expireIfPastDue(request);

  if (!approve) {
    // Atomic claim: only succeeds if the request is still PENDING at the
    // moment of update, so two near-simultaneous responses (or a response
    // racing the 3-minute expiry) can't both go through.
    const declined = await VirtualCardChargeRequest.findOneAndUpdate(
      { _id: requestId, card: card._id, status: 'PENDING' },
      { status: 'DECLINED', respondedAt: new Date() },
      { new: true }
    );
    if (!declined) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `This request already ${request.status.toLowerCase()}`
      );
    }
    return declined;
  }

  if (card.status !== 'ACTIVE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Your card is not active');
  }

  const settings = await getSettings();
  // The fee comes out of the merchant's payout, not the cardholder's
  // balance — the client's deck shows the remaining balance as
  // starting − purchase only, with the fee called out separately.
  const merchantPayout = request.amount * (1 - settings.spendFeePercent / 100);

  // Atomic debit: the balance check and the deduction happen in one
  // operation, so two concurrent approvals against the same card can't
  // both pass a stale balance check and over-spend it.
  const debited = await VirtualCard.findOneAndUpdate(
    { _id: card._id, status: 'ACTIVE', balance: { $gte: request.amount } },
    { $inc: { balance: -request.amount } },
    { new: true }
  );
  if (!debited) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Insufficient card balance');
  }

  const approved = await VirtualCardChargeRequest.findOneAndUpdate(
    { _id: requestId, card: card._id, status: 'PENDING' },
    { status: 'APPROVED', respondedAt: new Date() },
    { new: true }
  );
  if (!approved) {
    // Lost the race to another response after we'd already debited —
    // refund immediately since this response doesn't count.
    await VirtualCard.updateOne(
      { _id: card._id },
      { $inc: { balance: request.amount } }
    );
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This request was already responded to'
    );
  }

  await recordTransaction({
    card: card._id.toString(),
    type: 'SPEND',
    amount: -request.amount,
    balanceAfter: debited.balance,
    store: request.store.toString(),
    note: `Approved purchase — merchant paid out $${merchantPayout.toFixed(2)} after ${settings.spendFeePercent}% fee`,
  });

  return approved;
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

  // If admin ever issues a number at or above the auto-counter's current
  // value, bump the counter to match so a future auto-assigned card can't
  // later collide with this manually-issued one.
  const seq = parseInt(cardNumber, 10);
  if (!Number.isNaN(seq)) {
    await CardNumberCounter.findOneAndUpdate(
      { _id: 'virtualCardNumber' },
      { $max: { seq } },
      { upsert: true }
    );
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
