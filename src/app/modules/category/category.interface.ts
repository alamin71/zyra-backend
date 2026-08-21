import { Model } from 'mongoose';

export type ICategory = {
  name: string;
  slug: string;
  icon: string;
  order: number;
  isActive: boolean;
};

export type CategoryModel = Model<ICategory>;
