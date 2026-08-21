import { model, Schema } from 'mongoose';
import { FavoriteModel, IFavorite } from './favorite.interface';

const favoriteSchema = new Schema<IFavorite, FavoriteModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, store: 1 }, { unique: true });

export const Favorite = model<IFavorite, FavoriteModel>(
  'Favorite',
  favoriteSchema
);
