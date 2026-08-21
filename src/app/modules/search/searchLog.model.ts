import { model, Schema } from 'mongoose';
import { ISearchLog, SearchLogModel } from './searchLog.interface';

const searchLogSchema = new Schema<ISearchLog, SearchLogModel>({
  term: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now,
  },
});

searchLogSchema.index({ count: -1 });

export const SearchLog = model<ISearchLog, SearchLogModel>(
  'SearchLog',
  searchLogSchema
);
