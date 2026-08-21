import { model, Schema } from 'mongoose';
import { AddressModel, IAddress } from './address.interface';

const addressSchema = new Schema<IAddress, AddressModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1 });
addressSchema.index({ location: '2dsphere' });

export const Address = model<IAddress, AddressModel>('Address', addressSchema);
