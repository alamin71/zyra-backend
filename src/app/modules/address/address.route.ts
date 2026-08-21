import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { AddressController } from './address.controller';
import { AddressValidation } from './address.validation';

const router = express.Router();

const customer = auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR);

router
  .route('/')
  .get(customer, AddressController.getAddresses)
  .post(
    customer,
    validateRequest(AddressValidation.createAddressZodSchema),
    AddressController.createAddress
  );

router
  .route('/:id')
  .patch(
    customer,
    validateRequest(AddressValidation.updateAddressZodSchema),
    AddressController.updateAddress
  )
  .delete(
    customer,
    validateRequest(AddressValidation.addressIdZodSchema),
    AddressController.deleteAddress
  );

export const AddressRoutes = router;
