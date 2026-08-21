import { Model, Types } from 'mongoose';

export type ICartVariantSelection = {
  groupName: string;
  optionLabel: string;
  priceModifier: number;
};

export type ICartItem = {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  name: string;
  image?: string;
  unitPrice: number;
  variantSelections: ICartVariantSelection[];
  specialRequest?: string;
  quantity: number;
};

export type ICart = {
  user: Types.ObjectId;
  store: Types.ObjectId;
  items: ICartItem[];
};

export type CartModel = Model<ICart>;
