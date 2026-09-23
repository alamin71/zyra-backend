import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { VirtualCardService } from './virtualCard.service';

// ---- Customer ----

const getMyCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getMyCardFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Card retrieved successfully',
    data: result,
  });
});

const getMyTransactions = catchAsync(async (req, res) => {
  const { data, meta } = await VirtualCardService.getMyTransactionsFromDB(
    req.user.id,
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

const checkRecipient = catchAsync(async (req, res) => {
  const result = await VirtualCardService.checkRecipientFromDB(req.body.phone);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Checked successfully',
    data: result,
  });
});

const sendCredit = catchAsync(async (req, res) => {
  const result = await VirtualCardService.sendCreditToDB(
    req.user.id,
    req.body.amount,
    req.body.recipientPhone
  );

  sendResponse(res, {
    success: true,
    statusCode: result.requiresAction ? StatusCodes.OK : StatusCodes.CREATED,
    message: result.requiresAction
      ? 'Additional payment confirmation required'
      : result.delivered
        ? 'Credit sent successfully'
        : "Recipient isn't on Zyara yet — an invitation was sent",
    data: result,
  });
});

const getIncomingGifts = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getIncomingPendingGiftsFromDB(
    req.user.phone
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pending gifts retrieved successfully',
    data: result,
  });
});

const claimGift = catchAsync(async (req, res) => {
  const result = await VirtualCardService.claimPendingGiftToDB(
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

const transferBalance = catchAsync(async (req, res) => {
  const result = await VirtualCardService.transferBalanceToDB(
    req.user.id,
    req.body.recipientPhone,
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Transfer completed successfully',
    data: result,
  });
});

const getPendingChargeRequests = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getPendingChargeRequestsFromDB(
    req.user.id
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Pending charge requests retrieved successfully',
    data: result,
  });
});

const respondToChargeRequest = catchAsync(async (req, res) => {
  const result = await VirtualCardService.respondToChargeRequestToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body.approve
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      result.status === 'APPROVED' ? 'Charge approved' : 'Charge declined',
    data: result,
  });
});

// ---- Vendor ----

const createChargeRequest = catchAsync(async (req, res) => {
  const result = await VirtualCardService.createChargeRequestToDB(
    req.user.id,
    req.body.cardNumber,
    req.body.amount
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Charge request sent — waiting for cardholder approval',
    data: result,
  });
});

const getChargeRequestStatus = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getChargeRequestStatusFromDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Charge request status retrieved successfully',
    data: result,
  });
});

// ---- Admin ----

const getAllCards = catchAsync(async (req, res) => {
  const { data, meta } = await VirtualCardService.getAllCardsFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Cards retrieved successfully',
    data,
    meta,
  });
});

const issueCard = catchAsync(async (req, res) => {
  const result = await VirtualCardService.issueCardToDB(
    req.body.userId,
    req.body.cardNumber
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Card issued successfully',
    data: result,
  });
});

const getSettings = catchAsync(async (req, res) => {
  const result = await VirtualCardService.getSettingsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Settings retrieved successfully',
    data: result,
  });
});

const updateSettings = catchAsync(async (req, res) => {
  const result = await VirtualCardService.updateSettingsToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Settings updated successfully',
    data: result,
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
  getMyCard,
  getMyTransactions,
  checkRecipient,
  sendCredit,
  getIncomingGifts,
  claimGift,
  transferBalance,
  getPendingChargeRequests,
  respondToChargeRequest,
  createChargeRequest,
  getChargeRequestStatus,
  getAllCards,
  issueCard,
  getSettings,
  updateSettings,
  processExpiredCards,
};
