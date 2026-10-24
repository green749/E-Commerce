import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Price, Skeleton } from '../components/ui/index.js';
import { ordersApi } from '../api/orders.js';

export function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const [showConfetti, setShowConfetti] = useState(true);

  // Auto-dismiss confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.getOrderByNumber(orderNumber),
    enabled: Boolean(orderNumber),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div style={{ backgroundColor: 'var(--paper)', minHeight: '85vh', padding: 'var(--space-48) 0 var(--space-64)' }}>
      {/* Confetti Floating Particles CSS Animation */}
      {showConfetti && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => {
            const randomLeft = Math.random() * 100;
            const randomDelay = Math.random() * 2;
            const randomDuration = 2.5 + Math.random() * 2;
            const colors = ['#6366F1', '#EC4899', '#FFE600', '#10B981', '#3B82F6', '#F59E0B'];
            const color = colors[i % colors.length];
            const size = 8 + (i % 8);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: `${randomLeft}%`,
                  width: `${size}px`,
                  height: `${size * 1.5}px`,
                  backgroundColor: color,
                  borderRadius: i % 2 === 0 ? '50%' : '2px',
                  animation: `fall ${randomDuration}s linear ${randomDelay}s infinite`,
                  transform: `rotate(${i * 25}deg)`,
                  opacity: 0.85,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Success Icon & Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-32)' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-20)',
              border: '2px solid var(--primary)',
              animation: 'scaleUp 0.4s ease-out',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: '0 0 var(--space-8) 0',
            }}
          >
            Order Placed Successfully!
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--muted)', margin: 0 }}>
            Thank you for shopping with SHOPPE. Your inventory is committed and scheduled for priority packing.
          </p>
        </div>

        {/* Order Details Card */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: 'var(--space-32)' }}>
            <Skeleton width="60%" height="24px" />
            <Skeleton width="40%" height="18px" />
            <Skeleton width="100%" height="120px" />
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--paper)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-32)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: 'var(--space-32)',
            }}
          >
            {/* Top Order Number Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: 'var(--space-20)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-20)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Order Reference
                </span>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: 'var(--ink)' }}>
                  #{order?.order_number || orderNumber}
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <span>●</span> Payment Verified (Razorpay)
              </div>
            </div>

            {/* Delivery Address Snapshot */}
            {order?.shipping_address && (
              <div
                style={{
                  paddingBottom: 'var(--space-20)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-20)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                  Shipping Destination
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
                  {order.shipping_address.full_name} ({order.shipping_address.phone})
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                  {order.shipping_address.line1}
                  {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.pincode}
                </div>
              </div>
            )}

            {/* Purchased Items List */}
            {order?.items && (
              <div style={{ paddingBottom: 'var(--space-20)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 'var(--space-20)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
                  Items in this shipment
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.map((it) => (
                    <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                          {it.product_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Qty: {it.quantity} {it.sku ? `(SKU: ${it.sku})` : ''}
                        </div>
                      </div>
                      <Price price={it.unit_price * it.quantity} isPaise size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Total Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
                Total Paid
              </span>
              <Price price={order?.total || 0} isPaise size="lg" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-16)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/account/orders" style={{ textDecoration: 'none' }}>
            <Button size="lg" variant="primary">
              View Order in History →
            </Button>
          </Link>
          <Link to="/shop" style={{ textDecoration: 'none' }}>
            <Button size="lg" variant="secondary">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Confetti Keyframe Animation */}
      <style>{`
        @keyframes fall {
          0% {
            top: -20px;
            transform: rotate(0deg) translateX(0);
          }
          50% {
            transform: rotate(180deg) translateX(25px);
          }
          100% {
            top: 105vh;
            transform: rotate(360deg) translateX(-25px);
          }
        }
        @keyframes scaleUp {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default OrderSuccessPage;
