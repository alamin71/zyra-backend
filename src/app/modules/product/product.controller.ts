import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { uploadMultipleToS3 } from '../../../helpers/s3Helper';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { ProductService } from './product.service';

// Shared by create + update — both accept "images" as multipart file
// uploads; when files are sent, their uploaded URLs replace payload.images.
const applyImageUploads = async (
  req: Request,
  payload: Record<string, unknown>
) => {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const imageFiles = files?.images;
  if (imageFiles && imageFiles.length > 0) {
    payload.images = await uploadMultipleToS3(imageFiles, 'product/images');
  }
};

const getProducts = catchAsync(async (req, res) => {
  const { data, meta } = await ProductService.getProductsFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Products retrieved successfully',
    data,
    meta,
  });
});

const getProduct = catchAsync(async (req, res) => {
  const result = await ProductService.getProductByIdFromDB(
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Product retrieved successfully',
    data: result,
  });
});

// ----- Vendor panel (own store's products only) -----

const getOwnProducts = catchAsync(async (req, res) => {
  const { data, meta } = await ProductService.getOwnProductsFromDB(
    req.user.id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Products retrieved successfully',
    data,
    meta,
  });
});

const createOwnProduct = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  await applyImageUploads(req, payload);

  const result = await ProductService.createOwnProductToDB(
    req.user.id,
    payload
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Product created successfully',
    data: result,
  });
});

const updateOwnProduct = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  await applyImageUploads(req, payload);

  const result = await ProductService.updateOwnProductToDB(
    req.user.id,
    resolveParam(req.params.id),
    payload
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteOwnProduct = catchAsync(async (req, res) => {
  await ProductService.deleteOwnProductFromDB(
    req.user.id,
    resolveParam(req.params.id)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Product deleted successfully',
  });
});

export const ProductController = {
  getProducts,
  getProduct,
  getOwnProducts,
  createOwnProduct,
  updateOwnProduct,
  deleteOwnProduct,
};
