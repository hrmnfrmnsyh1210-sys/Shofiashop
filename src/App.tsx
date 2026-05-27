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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
