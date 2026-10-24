import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/ui/Toast.jsx';
import { RootLayout } from './layouts/RootLayout.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { AdminRoute } from './components/auth/AdminRoute.jsx';
import { useAuthStore } from './store/authStore.js';

// Code-Split Page Components
const HomePage = React.lazy(() => import('./pages/HomePage.jsx'));
const ShopPage = React.lazy(() => import('./pages/ShopPage.jsx'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = React.lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage.jsx'));
const LoginPage = React.lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage.jsx'));
const AccountPage = React.lazy(() => import('./pages/AccountPage.jsx'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage.jsx'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage.jsx'));
const AddressesPage = React.lazy(() => import('./pages/AddressesPage.jsx'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage.jsx'));
const AdminPage = React.lazy(() => import('./pages/AdminPage.jsx'));
const StyleguidePage = React.lazy(() => import('./pages/StyleguidePage.jsx'));
const AboutPage = React.lazy(() => import('./pages/AboutPage.jsx'));
const ImpactPage = React.lazy(() => import('./pages/ImpactPage.jsx'));
const GuidesPage = React.lazy(() => import('./pages/GuidesPage.jsx'));
const CollectionsPage = React.lazy(() => import('./pages/CollectionsPage.jsx'));
const FaqPage = React.lazy(() => import('./pages/FaqPage.jsx'));
const ContactPage = React.lazy(() => import('./pages/ContactPage.jsx'));
const IngredientsPage = React.lazy(() => import('./pages/IngredientsPage.jsx'));
const ShippingReturnsPage = React.lazy(() => import('./pages/ShippingReturnsPage.jsx'));

import { tracker } from './utils/tracker.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3,
    },
  },
});

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-48)',
      }}
      role="status"
      aria-label="Loading page content"
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    tracker.pageView({
      path: location.pathname,
      search: location.search,
      title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}

export function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <RouteTracker />
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<RootLayout />}>
              {/* Public Storefront Routes */}
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="product/:slug" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<LoginPage />} />
              <Route path="reset-password" element={<LoginPage />} />


              <Route path="about" element={<AboutPage />} />
              <Route path="story" element={<AboutPage />} />
              <Route path="impact" element={<ImpactPage />} />
              <Route path="sustainability" element={<ImpactPage />} />
              <Route path="guides" element={<GuidesPage />} />
              <Route path="collections" element={<CollectionsPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="ingredients" element={<IngredientsPage />} />
              <Route path="shipping" element={<ShippingReturnsPage />} />
              <Route path="returns" element={<ShippingReturnsPage />} />

              {/* Hidden Living Styleguide Route */}
              <Route path="styleguide" element={<StyleguidePage />} />

              {/* Customer Protected Routes */}
              <Route
                path="checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="order-success/:orderNumber"
                element={
                  <ProtectedRoute>
                    <OrderSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="account/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="account/orders/:orderNumber"
                element={
                  <ProtectedRoute>
                    <OrderDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="account/addresses"
                element={
                  <ProtectedRoute>
                    <AddressesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="wishlist"
                element={
                  <ProtectedRoute>
                    <WishlistPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected Operational Routes */}
              <Route
                path="admin/*"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
          </React.Suspense>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
