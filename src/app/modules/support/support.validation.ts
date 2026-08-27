import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const createHelpTopicZodSchema = z.object({
  body: z.object({
    question: z.string().trim().nonempty({ message: 'Question is required' }),
    answer: z.string().trim().nonempty({ message: 'Answer is required' }),
    order: z.number().int().optional(),
  }),
});

const updateHelpTopicZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid help topic id'),
  }),
  body: z.object({
    question: z.string().trim().optional(),
    answer: z.string().trim().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

const helpTopicIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid help topic id'),
  }),
});

const createSupportMessageZodSchema = z.object({
  body: z.object({
    message: z
      .string()
      .trim()
      .nonempty({ message: 'Message is required' }),
  }),
});

const updateSupportMessageZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid support message id'),
  }),
  body: z.object({
    status: z.enum(['open', 'resolved']),
  }),
});

export const SupportValidation = {
  createHelpTopicZodSchema,
  updateHelpTopicZodSchema,
  helpTopicIdZodSchema,
  createSupportMessageZodSchema,
  updateSupportMessageZodSchema,
};
