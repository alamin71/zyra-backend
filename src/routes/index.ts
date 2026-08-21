import express from 'express';
import { AddressRoutes } from '../app/modules/address/address.route';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { CartRoutes } from '../app/modules/cart/cart.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { FavoriteRoutes } from '../app/modules/favorite/favorite.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { OrderVendorRoutes } from '../app/modules/order/order.vendor.route';
import { ProductRoutes } from '../app/modules/product/product.route';
import { ProductVendorRoutes } from '../app/modules/product/product.vendor.route';
import { SearchRoutes } from '../app/modules/search/search.route';
import { StoreRoutes } from '../app/modules/store/store.route';
import { StoreVendorRoutes } from '../app/modules/store/store.vendor.route';
import { UserRouter } from '../app/modules/user/user.route';
import { VendorApplicationRoutes } from '../app/modules/vendorApplication/vendorApplication.route';
import { VoucherRoutes } from '../app/modules/voucher/voucher.route';

const router = express.Router();
const routes = [
  {
    path: '/auth',
    route: AuthRouter,
  },
  {
    path: '/users',
    route: UserRouter,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  {
    path: '/addresses',
    route: AddressRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/stores',
    route: StoreRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/vendor-applications',
    route: VendorApplicationRoutes,
  },
  {
    path: '/favorites',
    route: FavoriteRoutes,
  },
  {
    path: '/search',
    route: SearchRoutes,
  },
  {
    path: '/cart',
    route: CartRoutes,
  },
  {
    path: '/vouchers',
    route: VoucherRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  // Vendor panel — every route below is scoped to the calling vendor's own store.
  {
    path: '/vendor/store',
    route: StoreVendorRoutes,
  },
  {
    path: '/vendor/products',
    route: ProductVendorRoutes,
  },
  {
    path: '/vendor/orders',
    route: OrderVendorRoutes,
  },
];

routes.forEach((element) => {
  if (element?.path && element?.route) {
    router.use(element?.path, element?.route);
  }
});

export default router;
