import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { adminApi } from '../api/admin.js';

// Admin Page Sub-Sections
import { DashboardSection } from '../components/admin/DashboardSection.jsx';
import { ProductsSection } from '../components/admin/ProductsSection.jsx';
import { InventorySection } from '../components/admin/InventorySection.jsx';
import { OrdersSection } from '../components/admin/OrdersSection.jsx';
import { ReturnsSection } from '../components/admin/ReturnsSection.jsx';
import { CustomersSection } from '../components/admin/CustomersSection.jsx';
import { CouponsSection } from '../components/admin/CouponsSection.jsx';

const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'returns', label: 'Returns' },
  { id: 'customers', label: 'Customers' },
  { id: 'coupons', label: 'Coupons' },
];

const VALID_SECTIONS = [
  'dashboard',
  'products',
  'inventory',
  'orders',
  'returns',
  'customers',
  'coupons',
];

export function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState(null);

  // Derive active section from URL (e.g. /admin/inventory -> 'inventory', /admin -> 'dashboard')
  const activeSection = useMemo(() => {
    const raw = location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
    if (VALID_SECTIONS.includes(raw)) {
      return raw;
    }
    return 'dashboard';
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    async function loadSummary() {
      try {
        const res = await adminApi.getSummary();
        if (isMounted && res) {
          setSummary(res);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectSection = (sectionId) => {
    navigate(`/admin/${sectionId === 'dashboard' ? '' : sectionId}`);
  };

  const getSectionMetadata = () => {
    switch (activeSection) {
      case 'products':
        return {
          title: 'Product Catalog',
          badge: 'CATALOG',
          description: 'Manage botanical skincare products, SKU formulations, image galleries, and pricing.',
        };
      case 'inventory':
        return {
          title: 'Warehouse Inventory',
          badge: 'STOCK',
          description: 'Track SKU stock levels, reservations, and inline threshold adjustments.',
        };
      case 'orders':
        return {
          title: 'Order Processing',
          badge: 'FULFILLMENT',
          description: 'View customer orders, filter by status and date, and execute state transitions.',
        };
      case 'returns':
        return {
          title: 'Returns & RMA',
          badge: 'CLAIMS',
          description: 'Inspect return requests, authorize warranty tickets, and issue refunds.',
        };
      case 'customers':
        return {
          title: 'Customer Directory',
          badge: 'ACCOUNTS',
          description: 'Search customer accounts and review detailed lifetime purchase histories.',
        };
      case 'coupons':
        return {
          title: 'Promotional Coupons',
          badge: 'MARKETING',
          description: 'Create and configure discount vouchers, usage limits, and validity periods.',
        };
      case 'dashboard':
      default:
        return {
          title: 'Operational Dashboard',
          badge: 'REAL-TIME',
          description: 'Live daily revenue, order volume, dispatch queues, and critical stock alerts.',
        };
    }
  };

  const meta = getSectionMetadata();

  // Dynamic greeting based on local time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning,' : currentHour < 17 ? 'Good Afternoon,' : 'Good Evening,';
  const adminDisplayName =
    user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() || 'AD');

  // Dynamic Strategy Status and Fulfillment Gauge
  const fulfillmentRate = summary?.fulfillment_rate ?? 95.0;
  const strategyTitle =
    fulfillmentRate >= 85 ? 'Optimal' : fulfillmentRate >= 70 ? 'Active' : 'Attention';
  const strategySubtitle = `${fulfillmentRate}% Fulfillment Rate`;

  // Circular gauge geometry
  const gaugeRadius = 82;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const progressRatio = Math.min(100, Math.max(10, fulfillmentRate)) / 100;
  const strokeDashoffset = gaugeCircumference * (1 - progressRatio);
  const beadAngleRad = (-90 + progressRatio * 360) * (Math.PI / 180);
  const beadX = Math.round((95 + gaugeRadius * Math.cos(beadAngleRad)) * 10) / 10;
  const beadY = Math.round((95 + gaugeRadius * Math.sin(beadAngleRad)) * 10) / 10;

  // Formatted wallet / revenue figure from dynamic summary
  const todayRev = Number(summary?.today_revenue || 0);
  const totalRev = Number(summary?.total_revenue || 0);
  const walletLabel = todayRev > 0 ? "TODAY'S REVENUE" : 'TOTAL REVENUE';
  const activeRev = todayRev > 0 ? todayRev : totalRev;
  const revenueDisplay = `₹${Math.round(activeRev / 100).toLocaleString('en-IN')}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ede7df',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #f6f1ea 0%, #ebe4d8 100%)',
        padding: '24px 20px 48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Grand Rounded Dashboard Canvas Card (Optima Reference) */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          backgroundColor: '#ffffff',
          borderRadius: '32px',
          boxShadow: '0 20px 50px -10px rgba(24, 36, 27, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2dbce',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ================= 1. FLOATING PILL NAVBAR CAPSULE ================= */}
        <div
          style={{
            padding: '16px 24px 14px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f2ede4',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          {/* 1.1 Brand Monogram */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-heading)',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              color: '#c58925',
              userSelect: 'none',
            }}
          >
            <span>•</span>
            <span style={{ color: '#18241b' }}>OPTIMA</span>
            <span>•</span>
          </div>

          {/* 1.2 Center Horizontal Nav Tabs */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              overflowX: 'auto',
              padding: '4px 8px',
            }}
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSelectSection(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#18241b' : '#889387',
                    padding: '8px 4px',
                    position: 'relative',
                    transition: 'color 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#18241b';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#889387';
                  }}
                >
                  {tab.label}
                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '24px',
                        height: '2.5px',
                        backgroundColor: '#18241b',
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 1.3 Right Utilities: Storefront & Admin Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#18241b',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#f5f0ea',
                border: '1px solid #e5dfd3',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eae3d8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f0ea';
              }}
            >
              Storefront ↗
            </Link>

            {/* Quick Status Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#2e7d4d',
                backgroundColor: '#eaf7ef',
                padding: '5px 10px',
                borderRadius: '9999px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  display: 'inline-block',
                }}
              />
              <span>{user?.email || 'Live Node'}</span>
            </div>
          </div>
        </div>

        {/* ================= 2. WARM GOLDEN CANOPY WITH CENTER SCOOP ================= */}
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #d89c2c 0%, #c58925 100%)',
            color: '#ffffff',
            padding: '28px 44px 34px',
            minHeight: '160px',
            boxSizing: 'border-box',
          }}
        >
          {/* Golden Canopy Main Content Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* 2.1 LEFT: User Greeting & Avatar Monogram */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 0' }}>
              {/* Rounded Portrait Avatar Monogram */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#c58925',
                  letterSpacing: '0.04em',
                }}
              >
                {userInitials}
              </div>

              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: 1.2,
                  }}
                >
                  {greeting}
                </div>
                <div
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    marginTop: '2px',
                  }}
                >
                  {adminDisplayName}
                </div>
              </div>
            </div>

            {/* 2.2 CENTER: Dynamic Strategy Circular Progress Gauge (in scooped cutout) */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '260px',
                textAlign: 'center',
                paddingTop: '6px',
              }}
            >
              {/* Top Botanical/Strategy Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '2px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L6 14" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="16" cy="6" r="3" />
                </svg>
              </div>

              {/* Dynamic Title based on fulfillment health */}
              <div
                style={{
                  fontSize: '25px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  textShadow: '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                {strategyTitle}
              </div>

              {/* Dynamic Subtitle */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.85)',
                  letterSpacing: '0.04em',
                  marginTop: '2px',
                }}
              >
                {strategySubtitle}
              </div>

              {/* Dynamic Circular Gauge Ring with Endpoint Bead */}
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '190px',
                  height: '190px',
                  pointerEvents: 'none',
                }}
              >
                <svg width="190" height="190" viewBox="0 0 190 190">
                  {/* Subtle track background */}
                  <circle
                    cx="95"
                    cy="95"
                    r={gaugeRadius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeWidth="3.5"
                  />
                  {/* Dynamic Active White Arc */}
                  <circle
                    cx="95"
                    cy="95"
                    r={gaugeRadius}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={strokeDashoffset}
                    transform="rotate(-90 95 95)"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                  {/* Dynamic glowing bead on arc endpoint */}
                  <circle
                    cx={beadX}
                    cy={beadY}
                    r="5.5"
                    fill="#ffffff"
                    stroke="#c58925"
                    strokeWidth="2.5"
                    style={{ transition: 'all 0.6s ease' }}
                  />
                  <circle
                    cx={beadX}
                    cy={beadY}
                    r="9"
                    fill="none"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* 2.3 RIGHT: Wallet Icon & Real Dynamic Revenue */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '16px',
                flex: '1 1 0',
              }}
            >
              {/* Translucent Glowing Circle with Wallet Icon */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  border: '1.5px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                  <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'rgba(255, 255, 255, 0.85)',
                    textTransform: 'uppercase',
                  }}
                >
                  {walletLabel}
                </div>
                <div
                  style={{
                    fontSize: '34px',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                    marginTop: '2px',
                  }}
                >
                  {revenueDisplay}
                </div>
              </div>
            </div>
          </div>

          {/* 2.4 SVG ORGANIC SCOOP CUTOUT (Smoothly dips down in center) */}
          <svg
            viewBox="0 0 1200 65"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              bottom: '-64px',
              left: 0,
              width: '100%',
              height: '65px',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {/* Golden tongue dipping down between x=460 and x=740 */}
            <path
              d="M 0,0 L 455,0 C 500,0 535,62 600,62 C 665,62 700,0 745,0 L 1200,0 L 1200,0 L 0,0 Z"
              fill="#c58925"
            />
          </svg>
        </div>

        {/* ================= 3. WHITE BODY CANVAS CONTENT ================= */}
        <div
          style={{
            padding: '48px 36px 44px',
            backgroundColor: '#ffffff',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Subpage Breadcrumb Context Banner (when viewing Products, Inventory, Orders, etc.) */}
          {activeSection !== 'dashboard' && (
            <div
              style={{
                marginBottom: '28px',
                paddingBottom: '16px',
                borderBottom: '1px solid #ede8e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h1
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '26px',
                      fontWeight: 600,
                      color: '#18241b',
                      margin: 0,
                    }}
                  >
                    {meta.title}
                  </h1>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#eae3d8',
                      color: '#18241b',
                    }}
                  >
                    {meta.badge}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#667367', margin: 0 }}>
                  {meta.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectSection('dashboard')}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#18241b',
                  backgroundColor: '#f5f0ea',
                  border: '1px solid #dcd5c9',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eae3d8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5f0ea')}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

          {/* Section Dynamic Component Views */}
          {activeSection === 'dashboard' && (
            <DashboardSection onNavigate={handleSelectSection} />
          )}

          {activeSection === 'products' && <ProductsSection />}

          {activeSection === 'inventory' && <InventorySection />}

          {activeSection === 'orders' && <OrdersSection />}

          {activeSection === 'returns' && <ReturnsSection />}

          {activeSection === 'customers' && <CustomersSection />}

          {activeSection === 'coupons' && <CouponsSection />}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;

