import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { resolveParam } from '../../../shared/resolveParam';
import sendResponse from '../../../shared/sendResponse';
import { CategoryService } from './category.service';

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.createCategoryToDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const { data, meta } = await CategoryService.getCategoriesFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Categories retrieved successfully',
    data,
    meta,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryService.updateCategoryToDB(
    resolveParam(req.params.id),
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  await CategoryService.deleteCategoryFromDB(resolveParam(req.params.id));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Category deleted successfully',
  });
});

export const CategoryController = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
