import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import productRoutes from './modules/products/product.routes.js';
import memberRoutes from './modules/members/member.routes.js';
import transactionRoutes from './modules/transactions/transaction.routes.js';
import stockRoutes from './modules/stock/stock.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import userRoutes from './modules/users/user.routes.js';
import {
  tenantSuperRoutes,
  tenantAdminRoutes,
} from './modules/tenants/tenant.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/members', memberRoutes);
router.use('/transactions', transactionRoutes);
router.use('/stock', stockRoutes);
router.use('/reports', reportRoutes);
router.use('/activity', activityRoutes);

// Tenant management
router.use('/super/tenants', tenantSuperRoutes);
router.use('/admin/tenant', tenantAdminRoutes);
router.use('/admin/users', userRoutes);

// Public, customer-facing per-tenant storefront: /stores/:slug/...
router.use('/stores', catalogRoutes);

export default router;
