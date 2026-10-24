import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Drawer } from '../ui/Drawer.jsx';
import { useAuthStore } from '../../store/authStore.js';

export function MobileDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      onClose();
      navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleNav = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} position="left" width="320px" title="pure origin">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
        {/* Mobile Search Input */}
        <form onSubmit={handleSearch}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--paper-subtle)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              padding: '0 12px',
            }}
          >
            <input
              type="text"
              placeholder="Search botanical cleanser, serum..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: 'none',
                background: 'none',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--fs-small)',
                color: 'var(--ink)',
              }}
            />
            <button
              type="submit"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </form>

        {/* Categories Section */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--muted)',
              marginBottom: 'var(--space-12)',
            }}
          >
            Shop By Nature
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <button
              type="button"
              onClick={() => handleNav('/shop')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontSize: '17px',
                fontWeight: 600,
                color: '#1e382b',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Browse All Products
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=cleansers')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Cleansers
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=serums')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Serums
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=moisturizers')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Moisturizers
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=masks')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Masks
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=body-care')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Body Care
            </button>
            <button
              type="button"
              onClick={() => handleNav('/shop?category=refills-sets')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Refills & Starter Sets
            </button>
            <button
              type="button"
              onClick={() => handleNav('/collections')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e382b',
                cursor: 'pointer',
              }}
            >
              Collections
            </button>
            <button
              type="button"
              onClick={() => handleNav('/about')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => handleNav('/impact')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Our Impact
            </button>
            <button
              type="button"
              onClick={() => handleNav('/guides')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                fontSize: '14px',
                color: 'var(--slate)',
                cursor: 'pointer',
              }}
            >
              Skincare Guides
            </button>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* User Account Section */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--muted)',
              marginBottom: 'var(--space-12)',
            }}
          >
            My Account
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: 'var(--fs-small)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                }}
              >
                Signed in as {user?.name}
              </div>
              <button
                type="button"
                onClick={() => handleNav('/account')}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  cursor: 'pointer',
                }}
              >
                Profile & Details
              </button>
              <button
                type="button"
                onClick={() => handleNav('/account/orders')}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  cursor: 'pointer',
                }}
              >
                My Orders
              </button>
              <button
                type="button"
                onClick={() => handleNav('/account/addresses')}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  cursor: 'pointer',
                }}
              >
                Saved Addresses
              </button>
              <button
                type="button"
                onClick={() => handleNav('/wishlist')}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  color: 'var(--slate)',
                  cursor: 'pointer',
                }}
              >
                Saved Wishlist
              </button>

              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleNav('/admin')}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Admin Operations
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  marginTop: 'var(--space-8)',
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
              <button
                type="button"
                onClick={() => handleNav('/login')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'var(--ink)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-btn)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleNav('/register')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: 'var(--ink)',
                  border: '1.5px solid var(--ink)',
                  borderRadius: 'var(--radius-btn)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Styleguide link */}
        <Link
          to="/styleguide"
          onClick={onClose}
          style={{
            fontSize: '13px',
            color: 'var(--primary)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🎨</span> Open Design Styleguide
        </Link>
      </div>
    </Drawer>
  );
}

export default MobileDrawer;
