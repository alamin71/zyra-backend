import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { ICategory } from './category.interface';
import { Category } from './category.model';

const createCategoryToDB = async (payload: ICategory) => {
  const existing = await Category.findOne({ slug: payload.slug });
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      'A category with this slug already exists'
    );
  }

  return Category.create(payload);
};

const getCategoriesFromDB = async (query: Record<string, unknown>) => {
  const categoryQuery = new QueryBuilder(Category.find().lean(), {
    sort: 'order',
    ...query,
  })
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    categoryQuery.modelQuery,
    categoryQuery.countTotal(),
  ]);

  return { data, meta };
};

const updateCategoryToDB = async (id: string, payload: Partial<ICategory>) => {
  const category = await Category.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};

const deleteCategoryFromDB = async (id: string) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};

export const CategoryService = {
  createCategoryToDB,
  getCategoriesFromDB,
  updateCategoryToDB,
  deleteCategoryFromDB,
};
