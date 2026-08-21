import { model, Schema } from 'mongoose';
import { CategoryModel, ICategory } from './category.interface';

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ order: 1 });

export const Category = model<ICategory, CategoryModel>(
  'Category',
  categorySchema
);
