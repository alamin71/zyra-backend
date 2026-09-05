import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Product } from '../product/product.model';
import { ICartVariantSelection } from './cart.interface';
import { Cart } from './cart.model';

const EMPTY_CART = { store: null, items: [], subtotal: 0 };

const computeSubtotal = (
  items: { unitPrice: number; quantity: number }[]
): number => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

const getCartFromDB = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId })
    .populate(
      'store',
      'name logo addressText deliveryFee deliveryTimeMinutes minOrderAmount supportsDelivery supportsPickup manualStatus'
    )
    .lean();

  if (!cart) {
    return EMPTY_CART;
  }

  const suggestions = await Product.find({
    store: cart.store,
    isActive: true,
    _id: { $nin: cart.items.map((item) => item.product) },
  })
    .limit(4)
    .select('name images price discountPrice')
    .lean();

  return {
    ...cart,
    subtotal: computeSubtotal(cart.items),
    suggestions,
  };
};

// Client only ever sends which options it picked (groupName + optionLabel) —
// price and "is this even a valid combination" are resolved here from the
// product's own definition, never trusted from the request body.
const resolveVariantSelections = (
  product: {
    variantGroups: {
      name: string;
      required: boolean;
      options: { label: string; priceModifier: number }[];
    }[];
  },
  requested: { groupName: string; optionLabel: string }[]
): ICartVariantSelection[] => {
  const resolved: ICartVariantSelection[] = [];

  for (const group of product.variantGroups) {
    const picked = requested.find((r) => r.groupName === group.name);

    if (!picked) {
      if (group.required) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Please select an option for "${group.name}"`
        );
      }
      continue;
    }

    const option = group.options.find((o) => o.label === picked.optionLabel);
    if (!option) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `"${picked.optionLabel}" is not a valid option for "${group.name}"`
      );
    }

    resolved.push({
      groupName: group.name,
      optionLabel: option.label,
      priceModifier: option.priceModifier,
    });
  }

  return resolved;
};

// Compares only groupName/optionLabel/priceModifier — never raw JSON.stringify
// on Mongoose subdocuments directly, since a saved item's variantSelections
// carry Mongoose's own internal fields that a freshly-built plain array won't
// have, which would make identical selections look different.
const sameVariantSelections = (
  a: ICartVariantSelection[],
  b: ICartVariantSelection[]
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  const normalize = (selections: ICartVariantSelection[]) =>
    selections
      .map((s) => ({
        groupName: s.groupName,
        optionLabel: s.optionLabel,
        priceModifier: s.priceModifier,
      }))
      .sort((x, y) => x.groupName.localeCompare(y.groupName));

  return (
    JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
  );
};

const addItemToCart = async (
  userId: string,
  payload: {
    productId: string;
    variantSelections?: { groupName: string; optionLabel: string }[];
    specialRequest?: string;
    quantity?: number;
  }
) => {
  const product = await Product.findOne({
    _id: payload.productId,
    isActive: true,
  });
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  if (payload.specialRequest && !product.allowSpecialRequest) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'This product does not accept special requests'
    );
  }

  const variantSelections = resolveVariantSelections(
    product,
    payload.variantSelections ?? []
  );
  const unitPrice =
    (product.discountPrice ?? product.price) +
    variantSelections.reduce((sum, v) => sum + v.priceModifier, 0);
  const quantity = payload.quantity ?? 1;

  let cart = await Cart.findOne({ user: userId });

  // Switching to a product from a different store replaces the cart —
  // Zyara checkout is always single-store, matching every cart screen in
  // the Figma flow.
  if (cart && !cart.store.equals(product.store)) {
    await cart.deleteOne();
    cart = null;
  }

  if (!cart) {
    cart = new Cart({ user: userId, store: product.store, items: [] });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.product.equals(product._id) &&
      item.specialRequest === payload.specialRequest &&
      sameVariantSelections(item.variantSelections, variantSelections)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0],
      unitPrice,
      variantSelections,
      specialRequest: payload.specialRequest,
      quantity,
    });
  }

  await cart.save();
  return cart;
};

const getOwnedCart = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Your cart is empty');
  }
  return cart;
};

const updateItemQuantityInCart = async (
  userId: string,
  itemId: string,
  quantity: number
) => {
  const cart = await getOwnedCart(userId);
  const item = cart.items.find((i) => i._id?.toString() === itemId);
  if (!item) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart item not found');
  }

  item.quantity = quantity;
  await cart.save();
  return cart;
};

const removeItemFromCart = async (userId: string, itemId: string) => {
  const cart = await getOwnedCart(userId);
  const index = cart.items.findIndex((i) => i._id?.toString() === itemId);
  if (index === -1) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Cart item not found');
  }

  cart.items.splice(index, 1);

  if (cart.items.length === 0) {
    await cart.deleteOne();
    return null;
  }

  await cart.save();
  return cart;
};

const clearCartFromDB = async (userId: string) => {
  await Cart.findOneAndDelete({ user: userId });
  return true;
};

export const CartService = {
  getCartFromDB,
  addItemToCart,
  updateItemQuantityInCart,
  removeItemFromCart,
  clearCartFromDB,
};
