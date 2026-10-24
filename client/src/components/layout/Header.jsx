import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { catalogApi } from '../../api/catalog.js';
import { eventsApi } from '../../api/events.js';
import { CartDrawer } from '../cart/CartDrawer.jsx';

export function Header({ onOpenMobileMenu }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.count);
  const wishlistCount = useWishlistStore((s) => s.count);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const searchRef = useRef(null);
  const accountRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync initial cart & wishlist counts
  useEffect(() => {
    fetchCart();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [fetchCart, fetchWishlist, isAuthenticated]);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await catalogApi.getSuggestions(searchQuery.trim());
        setSuggestions(results || []);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      eventsApi.track('search', { query: searchQuery.trim() });
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(`/product/${slug}`);
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#1e382b', // Deep botanical forest green
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 12px rgba(15, 28, 20, 0.15)',
        }}
      >
        <div
          className="container"
          style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-24)',
          }}
        >
          {/* Mobile Menu Button (visible on mobile only) */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="mobile-menu-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Left: Brand Logo (pure origin with botanical leaf emblem) */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: '#ffffff',
            }}
          >
            {/* Delicate Botanical Leaf Sprout Emblem */}
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#889e8a' }}>
              <path d="M14 26V13" />
              <path d="M14 13C10 9 6 10 5 14c0 5 5 7 9 9" />
              <path d="M14 13C18 9 22 10 23 14c0 5-5 7-9 9" />
              <path d="M14 8c-2-3-5-4-7-3 0 3 2 5 7 6" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                }}
              >
                pure origin
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links (SHOP, COLLECTIONS, ABOUT US, OUR IMPACT, GUIDES) */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '36px',
            }}
          >
            <Link
              to="/shop"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f5f0ea',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              SHOP
            </Link>
            <Link
              to="/collections"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f5f0ea',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              COLLECTIONS
            </Link>
            <Link
              to="/about"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f5f0ea',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              ABOUT US
            </Link>
            <Link
              to="/impact"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f5f0ea',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              OUR IMPACT
            </Link>
            <Link
              to="/guides"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#f5f0ea',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              GUIDES
            </Link>
          </nav>

          {/* Right Action Icons: Admin Pill, Search, User Account, Cart with Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#b4532a',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(180, 83, 42, 0.3)',
                }}
              >
                <span>⚙️</span> Admin Console
              </Link>
            )}
            {/* Search Icon Trigger */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                aria-label="Search catalog"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              {/* Expandable Search Input Flyout */}
              {searchOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '320px',
                    backgroundColor: '#ffffff',
                    color: 'var(--ink)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                    padding: '12px',
                    zIndex: 200,
                  }}
                >
                  <form onSubmit={handleSearchSubmit}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f5f0ea',
                        borderRadius: '6px',
                        padding: '6px 12px',
                      }}
                    >
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search botanical cleanser, serum..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '13px',
                          color: 'var(--ink)',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#1e382b',
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        Go
                      </button>
                    </div>
                  </form>

                  {/* Suggestions list */}
                  {suggestions.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {suggestions.map((sug) => (
                        <div
                          key={sug.slug}
                          onClick={() => handleSuggestionClick(sug.slug)}
                          style={{
                            padding: '6px 8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f0ea')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {sug.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Menu Dropdown */}
            <div ref={accountRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-label="User account"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </button>

              {accountMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '200px',
                    backgroundColor: '#ffffff',
                    color: 'var(--ink)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                    padding: '8px 0',
                    zIndex: 200,
                  }}
                >
                  {isAuthenticated ? (
                    <>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#687367' }}>Signed in as</span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: user?.role === 'admin' ? '#faede7' : '#eaf2ec',
                              color: user?.role === 'admin' ? '#b4532a' : '#1e382b',
                            }}
                          >
                            {user?.role === 'admin' ? 'ADMINISTRATOR' : 'CUSTOMER'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e382b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user?.name || user?.email}
                        </div>
                      </div>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountMenuOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            backgroundColor: '#faede7',
                            color: '#b4532a',
                            fontWeight: 700,
                            textDecoration: 'none',
                            borderBottom: '1px solid #f0e0d8',
                          }}
                        >
                          <span>👑</span> Admin Console
                        </Link>
                      )}

                      <Link
                        to="/account"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: '#1e382b', textDecoration: 'none' }}
                      >
                        {user?.role === 'admin' ? 'Account Settings' : 'My Account Profile'}
                      </Link>
                      <Link
                        to="/account/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: '#1e382b', textDecoration: 'none' }}
                      >
                        Orders & Returns
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: '#1e382b', textDecoration: 'none' }}
                      >
                        Saved Addresses
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: '#1e382b', textDecoration: 'none' }}
                      >
                        Botanical Wishlist
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          logout();
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 16px',
                          border: 'none',
                          background: 'none',
                          fontSize: '13px',
                          color: '#b91c1c',
                          cursor: 'pointer',
                        }}
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setAccountMenuOpen(false)}
                        style={{ display: 'block', padding: '8px 16px', fontSize: '13px', color: '#1e382b', textDecoration: 'none' }}
                      >
                        Create an account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              aria-label="View wishlist"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.9,
                textDecoration: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    backgroundColor: '#889e8a',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with Counter Badge */}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label="View shopping bag"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.9,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {/* Badge counter matching screenshot style */}
              <span
                style={{
                  position: 'absolute',
                  top: '0px',
                  right: '0px',
                  backgroundColor: '#b4532a', // Warm terracotta badge
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-in Quick Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </>
  );
}

export default Header;
