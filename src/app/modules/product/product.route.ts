import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { ProductController } from './product.controller';
import { ProductValidation } from './product.validation';

const router = express.Router();

router.get('/', ProductController.getProducts);

router.get(
  '/:id',
  validateRequest(ProductValidation.productIdZodSchema),
  ProductController.getProduct
);

export const ProductRoutes = router;
