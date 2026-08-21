import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';
import optionalAuth from '../../middleware/optionalAuth';
import validateRequest from '../../middleware/validateRequest';
import { SearchController } from './search.controller';
import { SearchValidation } from './search.validation';

const router = express.Router();

router.get(
  '/',
  optionalAuth(),
  validateRequest(SearchValidation.searchQueryZodSchema),
  SearchController.search
);

router.get('/suggestions', optionalAuth(), SearchController.getSuggestions);

router.delete(
  '/recent',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR),
  SearchController.clearRecentSearches
);

export const SearchRoutes = router;
