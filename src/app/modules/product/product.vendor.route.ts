import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import { parseFormDataJson } from '../../middleware/parseFormDataJson';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';

const router = express.Router();

const vendor = auth(USER_ROLES.VENDOR);
const imagesUpload = s3FileUploadHandler.fields([
  { name: 'images', maxCount: 5 },
]);

router
  .route('/')
  .get(vendor, ProductController.getOwnProducts)
  .post(
    vendor,
    imagesUpload,
    parseFormDataJson,
    validateRequest(ProductValidation.createProductZodSchema),
    ProductController.createOwnProduct
  );

router
  .route('/:id')
  .patch(
    vendor,
    imagesUpload,
    parseFormDataJson,
    validateRequest(ProductValidation.updateProductZodSchema),
    ProductController.updateOwnProduct
  )
  .delete(
    vendor,
    validateRequest(ProductValidation.productIdZodSchema),
    ProductController.deleteOwnProduct
  );

export const ProductVendorRoutes = router;
