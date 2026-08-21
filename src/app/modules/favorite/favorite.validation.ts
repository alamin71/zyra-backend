import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const addFavoriteZodSchema = z.object({
  body: z.object({
    storeId: checkValidID('Invalid store id'),
  }),
});

const storeIdParamZodSchema = z.object({
  params: z.object({
    storeId: checkValidID('Invalid store id'),
  }),
});

export const FavoriteValidation = {
  addFavoriteZodSchema,
  storeIdParamZodSchema,
};
