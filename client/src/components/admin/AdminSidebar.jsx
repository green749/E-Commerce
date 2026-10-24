import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import {
  FiGrid,
  FiShoppingBag,
  FiLayers,
  FiFileText,
  FiRefreshCw,
  FiUsers,
  FiTag,
  FiArrowLeft,
} from 'react-icons/fi';

export function AdminSidebar({
  currentSection,
  onSelectSection,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const user = useAuthStore((s) => s.user);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'products', label: 'Products', icon: FiShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: FiLayers },
    { id: 'orders', label: 'Orders', icon: FiFileText },
    { id: 'returns', label: 'Returns', icon: FiRefreshCw },
    { id: 'customers', label: 'Customers', icon: FiUsers },
    { id: 'coupons', label: 'Coupons', icon: FiTag },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
          className="admin-mobile-backdrop"
        />
      )}

      <aside
        className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: 'var(--ink)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '100vh',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div>
          {/* Brand Header */}
          <div
            style={{
              padding: 'var(--space-24)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to="/admin"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '22px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: '#ffffff',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="#889e8a" strokeWidth="1.8">
                    <path d="M14 26V13" />
                    <path d="M14 13C10 9 6 10 5 14c0 5 5 7 9 9" />
                    <path d="M14 13C18 9 22 10 23 14c0 5-5 7-9 9" />
                    <path d="M14 8c-2-3-5-4-7-3 0 3 2 5 7 6" />
                  </svg>
                  pure origin
                </Link>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    backgroundColor: '#b4532a',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  ADMIN
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                Operations & Warehouse Hub
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="admin-sidebar-mobile-close"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'none',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav style={{ padding: 'var(--space-16) var(--space-12)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    }
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? '#b4532a' : 'inherit', flexShrink: 0 }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Storefront Link */}
        <div
          style={{
            padding: 'var(--space-20)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.65)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)')}
          >
            <FiArrowLeft size={15} /> Back to Storefront
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'admin@shoppe.com'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
