import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { CartService } from './cart.service';

const getCart = catchAsync(async (req, res) => {
  const result = await CartService.getCartFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Cart retrieved successfully',
    data: result,
  });
});

const addItem = catchAsync(async (req, res) => {
  const result = await CartService.addItemToCart(req.user.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Item added to cart',
    data: result,
  });
});

const updateItem = catchAsync(async (req, res) => {
  const result = await CartService.updateItemQuantityInCart(
    req.user.id,
    req.params.itemId,
    req.body.quantity
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Cart updated',
    data: result,
  });
});

const removeItem = catchAsync(async (req, res) => {
  const result = await CartService.removeItemFromCart(
    req.user.id,
    req.params.itemId
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Item removed from cart',
    data: result,
  });
});

const clearCart = catchAsync(async (req, res) => {
  await CartService.clearCartFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Cart cleared',
  });
});

export const CartController = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
