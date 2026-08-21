import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const variantOptionSchema = z.object({
  label: z.string().trim().nonempty(),
  priceModifier: z.number().optional(),
});

const variantGroupSchema = z.object({
  name: z.string().trim().nonempty(),
  required: z.boolean().optional(),
  options: z.array(variantOptionSchema).min(1),
});

const createProductZodSchema = z.object({
  body: z.object({
    category: checkValidID('Invalid category id'),
    name: z.string().trim().nonempty({ message: 'Product name is required' }),
    description: z.string().trim().optional(),
    images: z.array(z.string()).optional(),
    price: z.number().nonnegative({ message: 'Price is required' }),
    discountPrice: z.number().nonnegative().optional(),
    isTodaysOffer: z.boolean().optional(),
    variantGroups: z.array(variantGroupSchema).optional(),
    allowSpecialRequest: z.boolean().optional(),
  }),
});

const updateProductZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid product id'),
  }),
  body: z.object({
    category: checkValidID('Invalid category id').optional(),
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
    images: z.array(z.string()).optional(),
    price: z.number().nonnegative().optional(),
    discountPrice: z.number().nonnegative().optional(),
    isTodaysOffer: z.boolean().optional(),
    variantGroups: z.array(variantGroupSchema).optional(),
    allowSpecialRequest: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const productIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid product id'),
  }),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
  productIdZodSchema,
};
