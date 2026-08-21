import { z } from 'zod';

const searchQueryZodSchema = z.object({
  query: z.object({
    q: z.string().trim().optional(),
    type: z.enum(['stores', 'items']).optional(),
  }),
});

export const SearchValidation = {
  searchQueryZodSchema,
};
