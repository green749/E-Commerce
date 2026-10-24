import React, { useState, useEffect } from 'react';
import { Skeleton } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  FiArrowRight,
  FiPlus,
  FiPackage,
  FiTag,
  FiTrendingUp,
  FiCheckCircle,
  FiLayers,
} from 'react-icons/fi';

export function DashboardSection({ onNavigate }) {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState(null);
  const [latestOrders, setLatestOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [sumRes, ordersRes] = await Promise.allSettled([
          adminApi.getSummary(),
          adminApi.getOrders({ limit: 4 }),
        ]);

        if (isMounted) {
          if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
          if (ordersRes.status === 'fulfilled') setLatestOrders(ordersRes.value?.items || []);
        }
      } catch {
        // Handled silently
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic Warehouse Card Values
  const adminName = user?.name || (user?.email ? user.email.split('@')[0] : 'Pure Origin Admin');
  const maskedCardCode = `••••  ••••  ••••  ${
    user?.id ? user.id.replace(/-/g, '').slice(-4).toUpperCase() : '9821'
  }`;
  const expiryYear = new Date().getFullYear() + 3;

  // Dynamic Daily Revenue Chart Math
  const flowData = summary?.daily_revenue_flow || [];
  const maxRevenue = Math.max(...flowData.map((d) => d.revenue), 100000);
  const chartWidth = 320;
  const chartHeight = 110;
  const paddingX = 15;
  const bottomY = 95;
  const topY = 25;
  const stepX = flowData.length > 1 ? (chartWidth - paddingX * 2) / (flowData.length - 1) : 0;

  const chartPoints = flowData.map((d, i) => {
    const x = Math.round(paddingX + i * stepX);
    const ratio = maxRevenue > 0 ? d.revenue / maxRevenue : 0;
    const y = Math.round(bottomY - ratio * (bottomY - topY));
    return { x, y, revenue: d.revenue, label: d.label };
  });

  const splinePath =
    chartPoints.length > 0
      ? `M ${chartPoints
          .map((p, idx) => {
            if (idx === 0) return `${p.x},${p.y}`;
            const prev = chartPoints[idx - 1];
            const midX = (prev.x + p.x) / 2;
            return `C ${midX},${prev.y} ${midX},${p.y} ${p.x},${p.y}`;
          })
          .join(' ')}`
      : 'M 15,95 L 305,95';

  const areaPath =
    chartPoints.length > 0
      ? `${splinePath} L ${chartPoints[chartPoints.length - 1].x},${chartHeight} L ${
          chartPoints[0].x
        },${chartHeight} Z`
      : '';

  const peakPoint = chartPoints.reduce(
    (max, p) => (p.revenue > max.revenue ? p : max),
    chartPoints[0] || { x: 170, y: 25, revenue: 0 }
  );

  // Dynamic Radar Polygon Calculation
  const radarScores = [
    summary?.fulfillment_radar?.fulfillment ?? 95,
    summary?.fulfillment_radar?.stock_health ?? 90,
    summary?.fulfillment_radar?.order_rate ?? 85,
    summary?.fulfillment_radar?.dispatch_speed ?? 92,
    summary?.fulfillment_radar?.quality_score ?? 96,
  ];

  const radarPolygon = radarScores
    .map((score, i) => {
      const angleDeg = -90 + i * 72;
      const r = 40 * (Math.min(100, Math.max(25, score)) / 100);
      const x = Math.round((50 + r * Math.cos((angleDeg * Math.PI) / 180)) * 10) / 10;
      const y = Math.round((50 + r * Math.sin((angleDeg * Math.PI) / 180)) * 10) / 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 3-Column Modular Executive Dashboard Grid (Matching Optima Reference) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.05fr) minmax(320px, 1.35fr) minmax(280px, 1.1fr)',
          gap: '24px',
          alignItems: 'stretch',
        }}
        className="optima-dashboard-grid"
      >
        {/* ================= COLUMN 1 (LEFT) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1.1 Botanical Warehouse Pass Card (Teal/Sage Card from reference) */}
          <div
            style={{
              height: '185px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #4f7464 0%, #345244 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(52, 82, 68, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background subtle watermark glow */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Top row: Gold Chip + Contactless wave */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Gold Chip */}
              <div
                style={{
                  width: '36px',
                  height: '26px',
                  borderRadius: '5px',
                  backgroundColor: '#e4c875',
                  backgroundImage:
                    'linear-gradient(135deg, #f5df93 0%, #c9ab52 50%, #deb859 100%)',
                  border: '1px solid #b89539',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: 'rgba(0,0,0,0.15)',
                  }}
                />
              </div>

              {/* Contactless waves SVG */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2">
                <path d="M8.5 16.5a5 5 0 0 1 0-7" strokeLinecap="round" />
                <path d="M12 19a8.5 8.5 0 0 0 0-12" strokeLinecap="round" />
                <path d="M15.5 21.5a12 12 0 0 0 0-17" strokeLinecap="round" />
              </svg>
            </div>

            {/* Middle row: Dynamic Masked Admin ID */}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '17px',
                letterSpacing: '0.18em',
                color: '#ffffff',
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {maskedCardCode}
            </div>

            {/* Bottom row: Cardholder & Expiry & Overlapping Botanical Circles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)' }}>
                  Warehouse Pass
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginTop: '1px' }}>
                  {adminName} &nbsp;12/{expiryYear}
                </div>
              </div>

              {/* Overlapping translucent circles */}
              <div style={{ display: 'flex', position: 'relative', width: '38px', height: '24px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    position: 'absolute',
                    left: 0,
                  }}
                />
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    position: 'absolute',
                    right: 0,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 1.2 Terracotta Action Card (Coral Card from reference) */}
          <div
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #c75c36 0%, #aa4624 100%)',
              color: '#ffffff',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 6px 20px rgba(178, 83, 42, 0.22)',
            }}
          >
            {/* Voucher jar icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '22px',
              }}
            >
              🏷️
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.3 }}>
                Promotional Coupons
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                {summary?.total_coupons ?? 0} active discount codes configured.
              </div>
              <button
                type="button"
                onClick={() => onNavigate('coupons')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ADD COUPONS <FiArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* 1.3 Dynamic Category Action Columns */}
          <div
            style={{
              border: '1px solid #ebe5dc',
              borderRadius: '20px',
              padding: '16px 14px',
              backgroundColor: '#ffffff',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              textAlign: 'center',
            }}
          >
            {/* Action 1: Coupons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                <FiTag size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#18241b' }}>Coupons</span>
              <span style={{ fontSize: '10px', color: '#78867a', fontWeight: 500 }}>
                {summary?.total_coupons ?? 0} Active
              </span>
              <button
                type="button"
                onClick={() => onNavigate('coupons')}
                aria-label="Manage coupons"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #dcd5c9',
                  backgroundColor: '#f7f4ee',
                  color: '#18241b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                <FiPlus size={12} />
              </button>
            </div>

            {/* Action 2: Orders */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderLeft: '1px solid #f0eae1', borderRight: '1px solid #f0eae1' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#eaf7ef',
                  color: '#2e7d4d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                <FiPackage size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#18241b' }}>Orders</span>
              <span style={{ fontSize: '10px', color: '#78867a', fontWeight: 500 }}>
                {summary?.today_orders ?? 0} Today
              </span>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                aria-label="Manage orders"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #dcd5c9',
                  backgroundColor: '#f7f4ee',
                  color: '#18241b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                <FiPlus size={12} />
              </button>
            </div>

            {/* Action 3: Catalog */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                <FiLayers size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#18241b' }}>Catalog</span>
              <span style={{ fontSize: '10px', color: '#78867a', fontWeight: 500 }}>
                {summary?.total_products ?? 0} SKUs
              </span>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                aria-label="Manage products"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #dcd5c9',
                  backgroundColor: '#f7f4ee',
                  color: '#18241b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '2px',
                }}
              >
                <FiPlus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2 (CENTER) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 2.1 Dynamic Daily Revenue Trend Spline Chart */}
          <div
            style={{
              border: '1px solid #ebe5dc',
              borderRadius: '20px',
              padding: '20px 22px',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#18241b' }}>
                  Daily Revenue Flow
                </div>
                <div style={{ fontSize: '11px', color: '#78867a', marginTop: '2px' }}>
                  7-day live storefront order throughput
                </div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#2e7d4d',
                  backgroundColor: '#eaf7ef',
                  padding: '3px 8px',
                  borderRadius: '12px',
                }}
              >
                ● Live 7d
              </span>
            </div>

            {/* Spline Area Chart with Dynamic Y-axis markers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Dynamic Y Axis scale */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '110px',
                  fontSize: '10px',
                  color: '#9ba79d',
                  textAlign: 'right',
                  width: '32px',
                  fontFamily: 'monospace',
                }}
              >
                <span>₹{Math.round(maxRevenue / 100000)}k</span>
                <span>₹{Math.round(maxRevenue / 200000)}k</span>
                <span>0k</span>
              </div>

              {/* Responsive SVG Curve */}
              <div style={{ flex: 1, position: 'relative', height: '110px' }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="optimaGoldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dfa33a" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#dfa33a" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal soft dashed grid lines */}
                  <line x1="0" y1="25" x2={chartWidth} y2="25" stroke="#f0ebe2" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#f0ebe2" strokeDasharray="3 3" />
                  <line x1="0" y1="95" x2={chartWidth} y2="95" stroke="#f0ebe2" strokeDasharray="3 3" />

                  {/* Dynamic Gradient Area Fill */}
                  {areaPath && <path d={areaPath} fill="url(#optimaGoldGrad)" />}

                  {/* Dynamic Golden Spline Path */}
                  <path
                    d={splinePath}
                    fill="none"
                    stroke="#d49b35"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dynamic Peak glowing indicator */}
                  <circle
                    cx={peakPoint.x}
                    cy={peakPoint.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#d49b35"
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 2.2 Transactions / Recent Orders List */}
          <div
            style={{
              border: '1px solid #ebe5dc',
              borderRadius: '20px',
              padding: '20px',
              backgroundColor: '#ffffff',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#18241b' }}>
                Recent Transactions
              </div>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                aria-label="View all transactions"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#18241b',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiArrowRight />
              </button>
            </div>

            {/* List of Real Orders from DB */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="52px" style={{ borderRadius: '14px' }} />
                ))
              ) : latestOrders.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#889387', fontSize: '12px' }}>
                  No transactions recorded yet today.
                </div>
              ) : (
                latestOrders.slice(0, 3).map((ord) => {
                  const customerName =
                    ord.address_snapshot?.name || ord.customer_name || 'Storefront Customer';
                  const orderDate = ord.created_at
                    ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : 'Today';

                  return (
                    <div
                      key={ord.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        backgroundColor: '#f6f9f7',
                        border: '1px solid #edf2ee',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#e6f3eb',
                            color: '#2e7d4d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <FiCheckCircle size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#18241b' }}>
                            {ord.order_number}
                          </div>
                          <div style={{ fontSize: '10px', color: '#78867a' }}>
                            {customerName} • {orderDate}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#2e7d4d' }}>
                          +₹{Math.round(ord.total / 100).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#889387', fontWeight: 600 }}>
                          {ord.status}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= COLUMN 3 (RIGHT) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 3.1 Dynamic Radar Spider Chart & Dispatches */}
          <div
            style={{
              border: '1px solid #ebe5dc',
              borderRadius: '20px',
              padding: '18px 20px',
              backgroundColor: '#ffffff',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* Left side: Pentagon Radar/Spider chart calculated dynamically */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#18241b' }}>Fulfillment</span>
                <FiArrowRight size={13} style={{ color: '#18241b' }} />
              </div>
              <div style={{ width: '85px', height: '85px', margin: '0 auto', position: 'relative' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  {/* Outer Pentagon Grid */}
                  <polygon points="50,5 95,38 78,92 22,92 5,38" fill="none" stroke="#e6dfd3" strokeWidth="1" />
                  {/* Middle Pentagon */}
                  <polygon points="50,22 80,45 68,80 32,80 20,45" fill="none" stroke="#eee8de" strokeWidth="1" />
                  {/* Inner Pentagon */}
                  <polygon points="50,38 65,51 59,68 41,68 35,51" fill="none" stroke="#f3efe8" strokeWidth="1" />
                  {/* Dynamic Shaded Organic Shape */}
                  <polygon
                    points={radarPolygon}
                    fill="rgba(80, 160, 130, 0.22)"
                    stroke="#48866e"
                    strokeWidth="1.8"
                    strokeDasharray="2 2"
                    style={{ transition: 'all 0.6s ease' }}
                  />
                </svg>
              </div>
            </div>

            {/* Right side: Stock metric card */}
            <div style={{ borderLeft: '1px solid #f0ebe2', paddingLeft: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#18241b', marginBottom: '8px' }}>
                Dispatches
              </div>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}
              >
                <FiPackage size={16} />
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#18241b' }}>
                {summary?.pending_orders ?? 0}
              </div>
              <div style={{ fontSize: '10px', color: '#2e7d4d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                <FiTrendingUp size={11} /> +{summary?.fulfillment_rate ?? 95}% rate
              </div>
            </div>
          </div>

          {/* 3.2 Dynamic Top Performing SKUs from Database */}
          <div
            style={{
              border: '1px solid #ebe5dc',
              borderRadius: '20px',
              padding: '20px',
              backgroundColor: '#ffffff',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#18241b' }}>
                Top Performing SKUs
              </div>
              <button
                type="button"
                onClick={() => onNavigate('products')}
                aria-label="View all products"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#18241b',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FiArrowRight />
              </button>
            </div>

            {/* Dynamic Items with Sparklines from Backend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="40px" style={{ borderRadius: '10px' }} />
                ))
              ) : (summary?.top_skus || []).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#889387', fontSize: '12px' }}>
                  No top SKUs recorded yet.
                </div>
              ) : (
                (summary?.top_skus || []).slice(0, 3).map((sku, idx) => {
                  const trend = sku.trend || [20, 25, 22, 28, 30];
                  const minT = Math.min(...trend);
                  const maxT = Math.max(...trend, minT + 1);
                  const sparklinePoints = trend
                    .map((v, i) => {
                      const x = Math.round(2 + i * (46 / (trend.length - 1)));
                      const y = Math.round(18 - ((v - minT) / (maxT - minT)) * 14);
                      return `${x},${y}`;
                    })
                    .join(' L ');

                  return (
                    <div
                      key={sku.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor:
                              idx === 0 ? '#e6f3eb' : idx === 1 ? '#fef3c7' : '#eff6ff',
                            color:
                              idx === 0 ? '#2e7d4d' : idx === 1 ? '#b45309' : '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                          }}
                        >
                          {idx === 0 ? '🌿' : idx === 1 ? '🧴' : '✨'}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#18241b' }}>
                            {sku.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#78867a' }}>
                            {sku.category_name || 'Botanical'} • {sku.sku}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d4d' }}>
                            +{sku.change_pct}%
                          </div>
                          <div style={{ fontSize: '11px', color: '#18241b', fontWeight: 600 }}>
                            ₹{Math.round(sku.price / 100).toLocaleString('en-IN')}
                          </div>
                        </div>
                        {/* Dynamic Green Sparkline Curve */}
                        <svg width="45" height="20" viewBox="0 0 50 20">
                          <path
                            d={`M ${sparklinePoints}`}
                            fill="none"
                            stroke="#2e7d4d"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSection;

