import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { OrderService } from './order.service';

const checkout = catchAsync(async (req, res) => {
  const result = await OrderService.checkoutFromDB(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "We'll notify you as soon as the store confirms and starts processing your order",
    data: result,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const { data, meta } = await OrderService.getMyOrdersFromDB(
    req.user.id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Orders retrieved successfully',
    data,
    meta,
  });
});

const getMyOrder = catchAsync(async (req, res) => {
  const result = await OrderService.getMyOrderByIdFromDB(
    req.user.id,
    req.params.id
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const cancelMyOrder = catchAsync(async (req, res) => {
  const result = await OrderService.cancelMyOrderToDB(
    req.user.id,
    req.params.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order canceled successfully',
    data: result,
  });
});

const rateMyOrder = catchAsync(async (req, res) => {
  const result = await OrderService.rateMyOrderToDB(
    req.user.id,
    req.params.id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Thanks for your feedback',
    data: result,
  });
});

const reorder = catchAsync(async (req, res) => {
  const result = await OrderService.reorderToDB(req.user.id, req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Items added to your cart',
    data: result,
  });
});

// ----- Vendor panel -----

const getStoreOrders = catchAsync(async (req, res) => {
  const { data, meta } = await OrderService.getStoreOrdersFromDB(
    req.user.id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Orders retrieved successfully',
    data,
    meta,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const result = await OrderService.updateOrderStatusToDB(
    req.user.id,
    req.params.id,
    req.body.status
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order status updated',
    data: result,
  });
});

export const OrderController = {
  checkout,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
  rateMyOrder,
  reorder,
  getStoreOrders,
  updateOrderStatus,
};
