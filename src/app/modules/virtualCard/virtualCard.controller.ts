import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { VirtualCardService } from './virtualCard.service';

// ---- Customer ----

const loadVirtualCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.loadVirtualCardToDB(
    req.user.id,
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: result.requiresAction ? StatusCodes.OK : StatusCodes.CREATED,
    message: result.requiresAction
      ? 'Additional payment confirmation required'
      : 'Virtual card created and loaded successfully',
    data: result,
  });
});

const topUpVirtualCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.topUpVirtualCardToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.requiresAction
      ? 'Additional payment confirmation required'
      : 'Virtual card topped up successfully',
    data: result,
  });
});

const getMyVirtualCards = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getMyVirtualCardsFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Virtual cards retrieved successfully',
    data: result,
  });
});

const getVirtualCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getVirtualCardByIdFromDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Virtual card retrieved successfully',
    data: result,
  });
});

const getCardTransactions = catchAsync(async (req, res) => {
  const { data, meta } = await VirtualCardService.getCardTransactionsFromDB(
    req.user.id,
    resolveParam(req.params.id),
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Transactions retrieved successfully',
    data,
    meta,
  });
});

const giftVirtualCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.giftVirtualCardToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body.recipientPhone,
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Gift sent successfully',
    data: result,
  });
});

const modifyGift = catchAsync(async (req, res) => {
  const result = await VirtualCardService.modifyGiftToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gift updated successfully',
    data: result,
  });
});

const cancelGift = catchAsync(async (req, res) => {
  const result = await VirtualCardService.cancelGiftToDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gift cancelled and refunded to your card',
    data: result,
  });
});

const getIncomingGifts = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getIncomingGiftsFromDB(
    req.user.phone
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Incoming gifts retrieved successfully',
    data: result,
  });
});

const claimGift = catchAsync(async (req, res) => {
  const result = await VirtualCardService.claimGiftToDB(
    req.user.id,
    req.user.phone,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Gift claimed successfully',
    data: result,
  });
});

const generateRedemptionCode = catchAsync(async (req, res) => {
  const result = await VirtualCardService.generateRedemptionCodeToDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Show this code to the vendor to pay',
    data: result,
  });
});

// ---- Vendor ----

const redeemCode = catchAsync(async (req, res) => {
  const result = await VirtualCardService.redeemCodeToDB(
    req.user.id,
    req.body.code,
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Payment charged successfully',
    data: result,
  });
});

// ---- Admin ----

const getAllVirtualCards = catchAsync(async (req, res) => {
  const { data, meta } = await VirtualCardService.getAllVirtualCardsFromDB(
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Virtual cards retrieved successfully',
    data,
    meta,
  });
});

const processExpiredCards = catchAsync(async (req, res) => {
  const result = await VirtualCardService.processExpiredCardsToDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `${result.length} expired card(s) processed`,
    data: result,
  });
});

export const VirtualCardController = {
  loadVirtualCard,
  topUpVirtualCard,
  getMyVirtualCards,
  getVirtualCard,
  getCardTransactions,
  giftVirtualCard,
  modifyGift,
  cancelGift,
  getIncomingGifts,
  claimGift,
  generateRedemptionCode,
  redeemCode,
  getAllVirtualCards,
  processExpiredCards,
};
