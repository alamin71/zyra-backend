import { Model, Types } from 'mongoose';

export type IFavorite = {
  user: Types.ObjectId;
  store: Types.ObjectId;
};

export type FavoriteModel = Model<IFavorite>;
