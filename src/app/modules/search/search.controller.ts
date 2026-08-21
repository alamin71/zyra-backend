import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SearchService } from './search.service';

const search = catchAsync(async (req, res) => {
  const result = await SearchService.searchFromDB(req.query, req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Search results retrieved successfully',
    data: result,
  });
});

const getSuggestions = catchAsync(async (req, res) => {
  const result = await SearchService.getSuggestionsFromDB(req.user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Search suggestions retrieved successfully',
    data: result,
  });
});

const clearRecentSearches = catchAsync(async (req, res) => {
  await SearchService.clearRecentSearchesToDB(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Recent searches cleared',
  });
});

export const SearchController = {
  search,
  getSuggestions,
  clearRecentSearches,
};
