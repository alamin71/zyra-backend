import { z } from 'zod';

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    email: z.string().trim().email('Invalid email address').optional(),
    dob: z.coerce.date().optional(),
    image: z.string().optional(),
    preferences: z
      .object({
        language: z.enum(['ar', 'en']).optional(),
        currency: z.enum(['SYP', 'USD', 'EUR']).optional(),
      })
      .optional(),
  }),
});

export const UserValidation = {
  updateUserZodSchema,
};
