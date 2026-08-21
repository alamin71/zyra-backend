import { Model, Types } from 'mongoose';

export type IAddressLocation = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type IAddress = {
  user: Types.ObjectId;
  label: string;
  location: IAddressLocation;
  street: string;
  floor?: string;
  instructions?: string;
  isDefault: boolean;
};

export type AddressModel = Model<IAddress>;
