import { model, Schema } from 'mongoose';
import { CartModel, ICart } from './cart.interface';

const cartSchema = new Schema<ICart, CartModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    items: {
      type: [
        {
          product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          name: { type: String, required: true },
          image: { type: String },
          unitPrice: { type: Number, required: true },
          variantSelections: {
            type: [
              {
                _id: false,
                groupName: { type: String, required: true },
                optionLabel: { type: String, required: true },
                priceModifier: { type: Number, default: 0 },
              },
            ],
            default: [],
          },
          specialRequest: { type: String, trim: true },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Cart = model<ICart, CartModel>('Cart', cartSchema);
