import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { StoreService } from '../store/store.service';
import { IProduct } from './product.interface';
import { Product } from './product.model';

const getProductsFromDB = async (query: Record<string, unknown>) => {
  const productQuery = new QueryBuilder(
    Product.find({ isActive: true }).lean(),
    query
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    productQuery.modelQuery,
    productQuery.countTotal(),
  ]);

  return { data, meta };
};

const getProductByIdFromDB = async (id: string) => {
  const product = await Product.findOne({ _id: id, isActive: true })
    .populate('category', 'name slug')
    .lean();

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return product;
};

// Every vendor mutation is scoped to their own store — a vendor can never
// read or write another store's products, even by guessing a product id.
const getOwnProduct = async (ownerId: string, productId: string) => {
  const store = await StoreService.getStoreOwnedByVendor(ownerId);
  const product = await Product.findOne({ _id: productId, store: store._id });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return product;
};

const getOwnProductsFromDB = async (
  ownerId: string,
  query: Record<string, unknown>
) => {
  const store = await StoreService.getStoreOwnedByVendor(ownerId);

  const productQuery = new QueryBuilder(
    Product.find({ store: store._id }).lean(),
    query
  )
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    productQuery.modelQuery,
    productQuery.countTotal(),
  ]);

  return { data, meta };
};

const createOwnProductToDB = async (
  ownerId: string,
  payload: Omit<IProduct, 'store'>
) => {
  const store = await StoreService.getStoreOwnedByVendor(ownerId);
  return Product.create({ ...payload, store: store._id });
};

const updateOwnProductToDB = async (
  ownerId: string,
  productId: string,
  payload: Partial<IProduct>
) => {
  const product = await getOwnProduct(ownerId, productId);
  Object.assign(product, payload);
  await product.save();
  return product;
};

const deleteOwnProductFromDB = async (ownerId: string, productId: string) => {
  const product = await getOwnProduct(ownerId, productId);
  await product.deleteOne();
  return true;
};

export const ProductService = {
  getProductsFromDB,
  getProductByIdFromDB,
  getOwnProductsFromDB,
  createOwnProductToDB,
  updateOwnProductToDB,
  deleteOwnProductFromDB,
};
