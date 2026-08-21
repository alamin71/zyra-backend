import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { ProductService } from './product.service';

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
  const result = await ProductService.createOwnProductToDB(
    req.user.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Product created successfully',
    data: result,
  });
});

const updateOwnProduct = catchAsync(async (req, res) => {
  const result = await ProductService.updateOwnProductToDB(
    req.user.id,
    resolveParam(req.params.id),
    req.body
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
