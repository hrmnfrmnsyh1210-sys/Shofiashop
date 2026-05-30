import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import POS from './pages/admin/POS';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Members from './pages/admin/Members';
import Transactions from './pages/admin/Transactions';
import Stock from './pages/admin/Stock';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import SuperLayout from './pages/super/SuperLayout';
import SuperDashboard from './pages/super/SuperDashboard';
import Tenants from './pages/super/Tenants';
import SuperUsers from './pages/super/SuperUsers';
import SuperActivityLog from './pages/super/SuperActivityLog';
import ShopLayout from './pages/shop/ShopLayout';
import ShopHome from './pages/shop/ShopHome';
import ProductDetail from './pages/shop/ProductDetail';
import Cart from './pages/shop/Cart';
import Checkout from './pages/shop/Checkout';
import OrderConfirm from './pages/shop/OrderConfirm';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Per-tenant storefront */}
          <Route path="/s/:slug" element={<ShopLayout />}>
            <Route index element={<ShopHome />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order/:orderNumber" element={<OrderConfirm />} />
          </Route>

          {/* Legacy /shop redirects to default tenant — keep for now */}
          <Route path="/shop/*" element={<Navigate to="/s/sofiashop" replace />} />

          {/* Super admin */}
          <Route
            path="/super"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <SuperLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperDashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="users" element={<SuperUsers />} />
            <Route path="activity" element={<SuperActivityLog />} />
          </Route>

          {/* Store admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route
              path="categories"
              element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <Categories />
                </ProtectedRoute>
              }
            />
            <Route path="members" element={<Members />} />
            <Route path="transactions" element={<Transactions />} />
            <Route
              path="stock"
              element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <Stock />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
