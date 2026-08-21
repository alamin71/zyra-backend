import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { Favorite } from './favorite.model';

const addFavoriteToDB = async (userId: string, storeId: string) => {
  const existing = await Favorite.findOne({ user: userId, store: storeId });
  if (existing) {
    return existing;
  }
  return Favorite.create({ user: userId, store: storeId });
};

const removeFavoriteFromDB = async (userId: string, storeId: string) => {
  const result = await Favorite.findOneAndDelete({
    user: userId,
    store: storeId,
  });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, 'This store is not in your favorites');
  }
  return true;
};

const getFavoritesFromDB = async (userId: string) => {
  return Favorite.find({ user: userId })
    .sort('-createdAt')
    .populate(
      'store',
      'name logo banner categories addressText deliveryFee deliveryTimeMinutes manualStatus rating'
    )
    .lean();
};

export const FavoriteService = {
  addFavoriteToDB,
  removeFavoriteFromDB,
  getFavoritesFromDB,
};
