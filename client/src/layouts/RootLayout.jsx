import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { MobileBottomNav } from '../components/layout/MobileBottomNav.jsx';
import { MobileDrawer } from '../components/layout/MobileDrawer.jsx';

export function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ].some((path) => location.pathname.startsWith(path));

  if (isAdmin || isAuthPage) {
    return <Outlet />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header with wide search bar, cart & wishlist badges, account menu */}
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Slide-in Mobile Drawer */}
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Bold Footer in --ink with white text */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenSearch={() => setMobileMenuOpen(true)} />
    </div>
  );
}

export default RootLayout;
