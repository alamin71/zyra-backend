import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = express.Router();

const admin = auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN);

router
  .route('/')
  .get(CategoryController.getCategories)
  .post(
    admin,
    validateRequest(CategoryValidation.createCategoryZodSchema),
    CategoryController.createCategory
  );

router
  .route('/:id')
  .patch(
    admin,
    validateRequest(CategoryValidation.updateCategoryZodSchema),
    CategoryController.updateCategory
  )
  .delete(
    admin,
    validateRequest(CategoryValidation.categoryIdZodSchema),
    CategoryController.deleteCategory
  );

export const CategoryRoutes = router;
