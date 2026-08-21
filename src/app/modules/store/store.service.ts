import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { IStore } from './store.interface';
import { Store } from './store.model';

const PUBLIC_LIST_FIELDS =
  'name logo banner categories subCategories addressText location deliveryFee deliveryTimeMinutes minOrderAmount supportsDelivery supportsPickup manualStatus rating isFeatured';

const createStoreToDB = async (payload: IStore) => {
  return Store.create(payload);
};

const getStoresFromDB = async (query: Record<string, unknown>) => {
  const storeQuery = new QueryBuilder(
    Store.find({ isActive: true }).select(PUBLIC_LIST_FIELDS).lean(),
    query
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, meta] = await Promise.all([
    storeQuery.modelQuery,
    storeQuery.countTotal(),
  ]);

  return { data, meta };
};

const getStoreByIdFromDB = async (id: string) => {
  const store = await Store.findOne({ _id: id, isActive: true })
    .populate('categories', 'name slug icon')
    .lean();

  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Store not found');
  }

  return store;
};

// Shared by the vendor panel (store settings) and the product module
// (products always live under the calling vendor's own store).
const getStoreOwnedByVendor = async (ownerId: string) => {
  const store = await Store.findOne({ owner: ownerId });
  if (!store) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "You don't have a store yet. Your vendor application must be approved first."
    );
  }
  return store;
};

const updateOwnStoreToDB = async (
  ownerId: string,
  payload: Partial<IStore>
) => {
  const store = await getStoreOwnedByVendor(ownerId);
  Object.assign(store, payload);
  await store.save();
  return store;
};

const moderateStoreToDB = async (
  id: string,
  payload: Pick<Partial<IStore>, 'isActive' | 'isFeatured'>
) => {
  const store = await Store.findByIdAndUpdate(id, payload, { new: true });
  if (!store) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Store not found');
  }
  return store;
};

export const StoreService = {
  createStoreToDB,
  getStoresFromDB,
  getStoreByIdFromDB,
  getStoreOwnedByVendor,
  updateOwnStoreToDB,
  moderateStoreToDB,
};
