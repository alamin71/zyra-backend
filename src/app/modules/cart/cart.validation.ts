import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const variantSelectionInputSchema = z.object({
  groupName: z.string().trim().nonempty(),
  optionLabel: z.string().trim().nonempty(),
});

const addItemZodSchema = z.object({
  body: z.object({
    productId: checkValidID('Invalid product id'),
    variantSelections: z.array(variantSelectionInputSchema).optional(),
    specialRequest: z.string().trim().optional(),
    quantity: z.number().int().positive().optional(),
  }),
});

const updateItemZodSchema = z.object({
  params: z.object({
    itemId: checkValidID('Invalid cart item id'),
  }),
  body: z.object({
    quantity: z.number().int().positive({ message: 'Quantity is required' }),
  }),
});

const itemIdParamZodSchema = z.object({
  params: z.object({
    itemId: checkValidID('Invalid cart item id'),
  }),
});

export const CartValidation = {
  addItemZodSchema,
  updateItemZodSchema,
  itemIdParamZodSchema,
};
