import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../ui/index.js';
import { useAuthStore } from '../../store/authStore.js';

export function AccountLayout({ title, subtitle, breadcrumbs = [], children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Profile', path: '/account', icon: '👤' },
    { label: 'Orders', path: '/account/orders', icon: '📦' },
    { label: 'Addresses', path: '/account/addresses', icon: '📍' },
    { label: 'Wishlist', path: '/wishlist', icon: '❤️' },
  ];

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        {breadcrumbs.length > 0 && (
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        <div
          className="account-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 260px) 1fr',
            gap: 'var(--space-48)',
            alignItems: 'start',
          }}
        >
          {/* Simple Left Navigation (No Cards) */}
          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              paddingRight: 'var(--space-24)',
              borderRight: '1px solid var(--border)',
            }}
          >
            {/* User Info Header */}
            <div style={{ marginBottom: 'var(--space-24)', paddingBottom: 'var(--space-16)', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '17px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    flexShrink: 0,
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user?.name || 'Customer'}
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: user?.role === 'admin' ? '#faede7' : '#eaf2ec',
                        color: user?.role === 'admin' ? '#b4532a' : '#1e382b',
                      }}
                    >
                      {user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Links (No Cards - clean list) */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {user?.role === 'admin' && (
                <NavLink
                  to="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: '#b4532a',
                    backgroundColor: '#faede7',
                    marginBottom: '8px',
                    border: '1px solid #f0ded4',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>👑</span>
                  <span>Admin Console</span>
                </NavLink>
              )}

              {navItems.map((item) => {
                const isActive =
                  item.path === '/account'
                    ? location.pathname === '/account'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: isActive ? 700 : 500,
                      fontFamily: 'var(--font-heading)',
                      color: isActive ? 'var(--primary)' : 'var(--slate)',
                      backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span style={{ fontSize: '16px', opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '16px 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--danger)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                <span style={{ fontSize: '16px' }}>🚪</span>
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* Right Main Content Area (No Cards) */}
          <main style={{ minWidth: 0 }}>
            {(title || subtitle) && (
              <header style={{ marginBottom: 'var(--space-32)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-20)' }}>
                {title && <h1 className="h2" style={{ marginBottom: '6px' }}>{title}</h1>}
                {subtitle && <p style={{ color: 'var(--muted)', fontSize: '14px' }}>{subtitle}</p>}
              </header>
            )}

            <div>{children}</div>
          </main>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .account-container {
            grid-template-columns: 1fr !important;
            gap: var(--space-24) !important;
          }
          .account-container aside {
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
            padding-right: 0 !important;
            padding-bottom: var(--space-16) !important;
          }
          .account-container nav {
            flex-direction: row !important;
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AccountLayout;
