import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { PolicyPageController } from './policy-page.controller';
import { PolicyPageValidation } from './policy-page.validation';

const router = express.Router();

// Public, read-only — the app reads Privacy Policy / Terms & Conditions /
// About Zyara without needing to be logged in. Writing these stays under
// /admin (admin.route.ts), auth-gated.
router.get('/', PolicyPageController.getPolicyPages);

router.get(
  '/:type',
  validateRequest(PolicyPageValidation.getPolicyPageZodSchema),
  PolicyPageController.getPolicyPage
);

export const PolicyPagePublicRoutes = router;
