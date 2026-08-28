import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { uploadToS3 } from '../../../helpers/s3Helper';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { StoreService } from './store.service';

// Shared by create + vendor's own update — both accept logo/banner as
// multipart file uploads (s3FileUploadHandler) and upload whichever ones
// were sent, leaving payload.logo/banner untouched otherwise.
const applyLogoBannerUploads = async (
  req: Request,
  payload: Record<string, unknown>
) => {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const logoFile = files?.logo?.[0];
  if (logoFile) {
    payload.logo = await uploadToS3(logoFile, 'store/logo');
  }

  const bannerFile = files?.banner?.[0];
  if (bannerFile) {
    payload.banner = await uploadToS3(bannerFile, 'store/banner');
  }
};

const createStore = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  await applyLogoBannerUploads(req, payload);

  const result = await StoreService.createStoreToDB(payload);

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
  const payload = { ...req.body };
  await applyLogoBannerUploads(req, payload);

  const result = await StoreService.updateOwnStoreToDB(req.user.id, payload);

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
