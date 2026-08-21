import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);

router
  .route('/')
  .get(vendor, ProductController.getOwnProducts)
  .post(
    vendor,
    validateRequest(ProductValidation.createProductZodSchema),
    ProductController.createOwnProduct
  );

router
  .route('/:id')
  .patch(
    vendor,
    validateRequest(ProductValidation.updateProductZodSchema),
    ProductController.updateOwnProduct
  )
  .delete(
    vendor,
    validateRequest(ProductValidation.productIdZodSchema),
    ProductController.deleteOwnProduct
  );

export const ProductVendorRoutes = router;
