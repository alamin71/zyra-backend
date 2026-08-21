import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const createCategoryZodSchema = z.object({
  body: z.object({
    name: z.string().trim().nonempty({ message: 'Name is required' }),
    slug: z.string().trim().nonempty({ message: 'Slug is required' }),
    icon: z.string().trim().optional(),
    order: z.number().int().optional(),
  }),
});

const updateCategoryZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid category id'),
  }),
  body: z.object({
    name: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    icon: z.string().trim().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

const categoryIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid category id'),
  }),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
  categoryIdZodSchema,
};
