import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../builder/QueryBuilder';
import { Product } from '../product/product.model';
import { Store } from '../store/store.model';
import { User } from '../user/user.model';
import { SearchLog } from './searchLog.model';

const RECENT_SEARCH_CAP = 10;
const STORE_LIST_FIELDS =
  'name logo banner categories addressText deliveryFee deliveryTimeMinutes manualStatus rating';

const logSearchTerm = async (rawTerm: string, user?: JwtPayload) => {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return;

  await SearchLog.findOneAndUpdate(
    { term },
    { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
    { upsert: true }
  );

  if (user) {
    await User.findByIdAndUpdate(user.id, {
      $pull: { recentSearches: { term } },
    });
    await User.findByIdAndUpdate(user.id, {
      $push: {
        recentSearches: {
          $each: [{ term, searchedAt: new Date() }],
          $position: 0,
          $slice: RECENT_SEARCH_CAP,
        },
      },
    });
  }
};

const searchFromDB = async (
  query: Record<string, unknown>,
  user?: JwtPayload
) => {
  const q = (query.q as string) ?? '';
  const type = query.type === 'stores' ? 'stores' : 'items';

  const [storeCount, productCount] = await Promise.all([
    q ? Store.countDocuments({ isActive: true, name: new RegExp(q, 'i') }) : 0,
    q
      ? Product.countDocuments({
          isActive: true,
          $or: [{ name: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }],
        })
      : 0,
  ]);

  const listQuery: Record<string, unknown> = {
    searchTerm: q,
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    fields: query.fields,
  };

  let data: unknown[] = [];
  let meta;

  if (q) {
    if (type === 'stores') {
      const storeQuery = new QueryBuilder(
        Store.find({ isActive: true }).select(STORE_LIST_FIELDS).lean(),
        listQuery
      )
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();

      [data, meta] = await Promise.all([
        storeQuery.modelQuery,
        storeQuery.countTotal(),
      ]);
    } else {
      const productQuery = new QueryBuilder(
        Product.find({ isActive: true }).lean(),
        listQuery
      )
        .search(['name', 'description'])
        .filter()
        .sort()
        .paginate()
        .fields();

      [data, meta] = await Promise.all([
        productQuery.modelQuery,
        productQuery.countTotal(),
      ]);
    }

    await logSearchTerm(q, user);
  }

  return {
    query: q,
    type,
    counts: { stores: storeCount, items: productCount },
    data,
    meta,
  };
};

const getSuggestionsFromDB = async (user?: JwtPayload) => {
  const [recentSearches, trending, featuredStores] = await Promise.all([
    user
      ? User.findById(user.id).select('+recentSearches').lean()
      : Promise.resolve(null),
    SearchLog.find().sort('-count').limit(6).select('term -_id').lean(),
    Store.find({ isActive: true, isFeatured: true })
      .select(STORE_LIST_FIELDS)
      .limit(6)
      .lean(),
  ]);

  return {
    recentSearches: recentSearches?.recentSearches ?? [],
    trending: trending.map((t) => t.term),
    featuredStores,
  };
};

const clearRecentSearchesToDB = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $set: { recentSearches: [] } });
  return true;
};

export const SearchService = {
  searchFromDB,
  getSuggestionsFromDB,
  clearRecentSearchesToDB,
};
