import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { StoreService } from './store.service';

const createStore = catchAsync(async (req, res) => {
  const result = await StoreService.createStoreToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Store created successfully',
    data: result,
  });
});

const getStores = catchAsync(async (req, res) => {
  const { data, meta } = await StoreService.getStoresFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Stores retrieved successfully',
    data,
    meta,
  });
});

const getStore = catchAsync(async (req, res) => {
  const result = await StoreService.getStoreByIdFromDB(
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Store retrieved successfully',
    data: result,
  });
});

const moderateStore = catchAsync(async (req, res) => {
  const result = await StoreService.moderateStoreToDB(
    resolveParam(req.params.id),
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Store updated successfully',
    data: result,
  });
});

// ----- Vendor panel (own store only) -----

const getOwnStore = catchAsync(async (req, res) => {
  const result = await StoreService.getStoreOwnedByVendor(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Store retrieved successfully',
    data: result,
  });
});

const updateOwnStore = catchAsync(async (req, res) => {
  const result = await StoreService.updateOwnStoreToDB(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Store updated successfully',
    data: result,
  });
});

export const StoreController = {
  createStore,
  getStores,
  getStore,
  moderateStore,
  getOwnStore,
  updateOwnStore,
};
