import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { FavoriteService } from './favorite.service';

const addFavorite = catchAsync(async (req, res) => {
  const result = await FavoriteService.addFavoriteToDB(
    req.user.id,
    req.body.storeId
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Store added to favorites',
    data: result,
  });
});

const removeFavorite = catchAsync(async (req, res) => {
  await FavoriteService.removeFavoriteFromDB(
    req.user.id,
    resolveParam(req.params.storeId)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Store removed from favorites',
  });
});

const getFavorites = catchAsync(async (req, res) => {
  const result = await FavoriteService.getFavoritesFromDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Favorites retrieved successfully',
    data: result,
  });
});

export const FavoriteController = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
