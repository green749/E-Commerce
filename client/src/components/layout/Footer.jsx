import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer
      style={{
        backgroundColor: '#1b3b2b', // Deep botanical forest green matching screenshot
        color: '#f5f0ea',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: 'auto',
      }}
    >
      <div className="container" style={{ padding: '60px var(--space-24) 40px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Column 1: Brand & Copyright */}
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: '#ffffff',
                marginBottom: '16px',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#889e8a' }}>
                <path d="M14 26V13" />
                <path d="M14 13C10 9 6 10 5 14c0 5 5 7 9 9" />
                <path d="M14 13C18 9 22 10 23 14c0 5-5 7-9 9" />
                <path d="M14 8c-2-3-5-4-7-3 0 3 2 5 7 6" />
              </svg>
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
            </Link>

            <p style={{ fontSize: '11px', color: 'rgba(245, 240, 234, 0.6)', lineHeight: '18px', margin: 0 }}>
              © 2026 Pure Origin. All rights reserved.
            </p>
          </div>

          {/* Column 2: SHOP */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '16px',
              }}
            >
              SHOP
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/shop" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/collections" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/shop?sort=newest" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?category=refills-sets" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Gift Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: HELP */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '16px',
              }}
            >
              HELP
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/faq" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Shipping
                </Link>
              </li>
              <li>
                <Link to="/returns" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Returns
                </Link>
              </li>
              <li>
                <Link to="/contact" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: ABOUT */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '16px',
              }}
            >
              ABOUT
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/about" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/ingredients" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Ingredients
                </Link>
              </li>
              <li>
                <Link to="/impact" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Sustainability
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', textDecoration: 'none' }}>
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: STAY IN THE LOOP */}
          <div style={{ minWidth: '220px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              STAY IN THE LOOP
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(245, 240, 234, 0.75)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
              Tips, rituals, and clean beauty in your inbox.
            </p>

            {subscribed ? (
              <div style={{ fontSize: '12px', color: '#889e8a', fontWeight: 600 }}>
                ✓ Welcome to the Pure Origin ritual circle!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 36px 0 12px',
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1e382b',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '4px',
                    bottom: '4px',
                    width: '30px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#1e382b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  →
                </button>
              </form>
            )}

            {/* Social Media Links matching screenshot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: 'rgba(245, 240, 234, 0.7)', textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" style={{ color: 'rgba(245, 240, 234, 0.7)', textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer" aria-label="Pinterest" style={{ color: 'rgba(245, 240, 234, 0.7)', textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <circle cx="12" cy="12" r="9"></circle>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" style={{ color: 'rgba(245, 240, 234, 0.7)', textDecoration: 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
