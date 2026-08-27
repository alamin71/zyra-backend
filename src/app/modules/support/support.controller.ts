import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { SupportService } from './support.service';

// ---- Help Topics ----

const createHelpTopic = catchAsync(async (req, res) => {
  const result = await SupportService.createHelpTopicToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Help topic created successfully',
    data: result,
  });
});

const getHelpTopics = catchAsync(async (req, res) => {
  const { data, meta } = await SupportService.getHelpTopicsFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Help topics retrieved successfully',
    data,
    meta,
  });
});

const getHelpTopic = catchAsync(async (req, res) => {
  const result = await SupportService.getHelpTopicFromDB(
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Help topic retrieved successfully',
    data: result,
  });
});

const updateHelpTopic = catchAsync(async (req, res) => {
  const result = await SupportService.updateHelpTopicToDB(
    resolveParam(req.params.id),
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Help topic updated successfully',
    data: result,
  });
});

const deleteHelpTopic = catchAsync(async (req, res) => {
  await SupportService.deleteHelpTopicFromDB(resolveParam(req.params.id));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Help topic deleted successfully',
  });
});

// ---- Support (Contact Us) Messages ----

const createSupportMessage = catchAsync(async (req, res) => {
  const result = await SupportService.createSupportMessageToDB(
    req.user.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Your message has been sent. Our support team will get back to you soon.',
    data: result,
  });
});

const getSupportMessages = catchAsync(async (req, res) => {
  const { data, meta } = await SupportService.getSupportMessagesFromDB(
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Support messages retrieved successfully',
    data,
    meta,
  });
});

const updateSupportMessage = catchAsync(async (req, res) => {
  const result = await SupportService.updateSupportMessageStatusToDB(
    resolveParam(req.params.id),
    req.body.status
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Support message updated successfully',
    data: result,
  });
});

export const SupportController = {
  createHelpTopic,
  getHelpTopics,
  getHelpTopic,
  updateHelpTopic,
  deleteHelpTopic,
  createSupportMessage,
  getSupportMessages,
  updateSupportMessage,
};
