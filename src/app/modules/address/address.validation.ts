import { z } from 'zod';
import { checkValidID } from '../../../shared/checkValidID';

const coordinatesSchema = z
  .tuple([z.number(), z.number()])
  .describe('[longitude, latitude]');

const createAddressZodSchema = z.object({
  body: z.object({
    label: z.string().trim().nonempty({ message: 'Address label is required' }),
    street: z.string().trim().nonempty({ message: 'Street is required' }),
    floor: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    isDefault: z.boolean().optional(),
    location: z.object({
      coordinates: coordinatesSchema,
    }),
  }),
});

const updateAddressZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid address id'),
  }),
  body: z.object({
    label: z.string().trim().optional(),
    street: z.string().trim().optional(),
    floor: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    isDefault: z.boolean().optional(),
    location: z
      .object({
        coordinates: coordinatesSchema,
      })
      .optional(),
  }),
});

const addressIdZodSchema = z.object({
  params: z.object({
    id: checkValidID('Invalid address id'),
  }),
});

export const AddressValidation = {
  createAddressZodSchema,
  updateAddressZodSchema,
  addressIdZodSchema,
};
