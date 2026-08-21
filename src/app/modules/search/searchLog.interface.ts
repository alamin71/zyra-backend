import { Model } from 'mongoose';

export type ISearchLog = {
  term: string;
  count: number;
  lastSearchedAt: Date;
};

export type SearchLogModel = Model<ISearchLog>;
