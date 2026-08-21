import { Model, Types } from 'mongoose';

export type IProductVariantOption = {
  label: string;
  priceModifier: number;
};

export type IProductVariantGroup = {
  name: string;
  required: boolean;
  options: IProductVariantOption[];
};

export type IProduct = {
  store: Types.ObjectId;
  category: Types.ObjectId;
  name: string;
  description?: string;
  images: string[];
  price: number;
  discountPrice?: number;
  isTodaysOffer: boolean;
  variantGroups: IProductVariantGroup[];
  allowSpecialRequest: boolean;
  isActive: boolean;
  soldCount: number;
};

export type ProductModel = Model<IProduct>;
