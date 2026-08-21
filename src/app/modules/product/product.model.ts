import { model, Schema } from 'mongoose';
import { IProduct, ProductModel } from './product.interface';

const productSchema = new Schema<IProduct, ProductModel>(
  {
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    isTodaysOffer: {
      type: Boolean,
      default: false,
    },
    variantGroups: {
      type: [
        {
          name: { type: String, required: true },
          required: { type: Boolean, default: false },
          options: {
            type: [
              {
                label: { type: String, required: true },
                priceModifier: { type: Number, default: 0 },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    allowSpecialRequest: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ store: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text' });

export const Product = model<IProduct, ProductModel>('Product', productSchema);
