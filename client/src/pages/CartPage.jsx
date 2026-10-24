import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Breadcrumbs,
  Price,
  QuantityStepper,
  Button,
  Input,
  EmptyState,
  useToast,
} from '../components/ui/index.js';
import { useCartStore } from '../store/cartStore.js';
import { eventsApi } from '../api/events.js';

export function CartPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    items,
    count,
    subtotal,
    discount,
    shipping_fee,
    tax,
    total,
    free_shipping_threshold,
    coupon,
    warnings,
    isLoading,
    fetchCart,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Fetch latest cart on mount and track page_view
  useEffect(() => {
    fetchCart();
    eventsApi.track('page_view', {
      page: '/cart',
      title: 'Shopping Bag',
    });
  }, [fetchCart]);

  // Free shipping calculation
  const missingForFreeShipping = Math.max(0, free_shipping_threshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / free_shipping_threshold) * 100)
  );

  // Apply coupon handler
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      setCouponLoading(true);
      setCouponError('');
      await applyCoupon(couponCode.trim());
      showToast(`Coupon "${couponCode.trim().toUpperCase()}" applied successfully!`, 'success');
      setCouponCode('');
    } catch (err) {
      setCouponError(err.message || 'Invalid or expired promotional coupon');
      showToast(err.message || 'Failed to apply coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon handler
  const handleRemoveCoupon = async () => {
    try {
      setCouponLoading(true);
      await removeCoupon();
      showToast('Coupon removed from cart', 'neutral');
      setCouponError('');
    } catch (err) {
      showToast(err.message || 'Failed to remove coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--paper)', minHeight: '85vh', paddingBottom: 'var(--space-64)' }}>
      {/* Header & Breadcrumbs */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper-subtle)',
          padding: 'var(--space-20) 0',
        }}
      >
        <div className="container">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag' }]} />
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 'var(--space-12) 0 0 0',
            }}
          >
            Shopping Bag {count > 0 && `(${count})`}
          </h1>
        </div>
      </div>

      <div className="container" style={{ marginTop: 'var(--space-32)' }}>
        {/* Dynamic Warnings Bar (Price changes, stock drops) */}
        {warnings && warnings.length > 0 && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FEF3C7',
              border: '1.5px solid #F59E0B',
              marginBottom: 'var(--space-24)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <strong style={{ color: '#92400E', fontFamily: 'var(--font-heading)', fontSize: '14px' }}>
                Important Updates to Your Bag:
              </strong>
            </div>
            {warnings.map((warn, i) => (
              <div key={i} style={{ color: '#B45309', fontSize: '13px', paddingLeft: '26px' }}>
                • {warn}
              </div>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            title="Your Shopping Bag is Empty"
            description="You haven't added any reference audio equipment, custom keyboards, or workspace tools yet."
            actionText="Start Shopping"
            actionHref="/shop"
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-48)',
              alignItems: 'flex-start',
            }}
          >
            {/* ========================================================== */}
            {/* LEFT: OPEN LIST OF ITEMS (DIVIDERS, NOT CARDS) */}
            {/* ========================================================== */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Free Shipping Progress Line */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--paper-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-24)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    {missingForFreeShipping === 0 ? (
                      <span style={{ color: 'var(--success)' }}>
                        🎉 Congratulations! You have unlocked FREE Express Air Shipping.
                      </span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong style={{ color: 'var(--primary)' }}>
                          ₹{Math.ceil(missingForFreeShipping / 100).toLocaleString('en-IN')}
                        </strong>{' '}
                        more to unlock FREE priority shipping!
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                    {freeShippingProgress}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${freeShippingProgress}%`,
                      height: '100%',
                      backgroundColor: missingForFreeShipping === 0 ? 'var(--success)' : 'var(--primary)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Items List (Separated by Dividers, No Card Containers) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-20)',
                      padding: 'var(--space-24) 0',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <Link
                      to={`/product/${item.slug}`}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                        backgroundColor: 'var(--paper-subtle)',
                      }}
                    >
                      <img
                        src={item.image_url || 'https://picsum.photos/seed/default-cart/200/200'}
                        alt={item.product_name}
                        loading="lazy"
                        decoding="async"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Link>

                    {/* Item Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 'var(--space-16)',
                        }}
                      >
                        <div>
                          <Link
                            to={`/product/${item.slug}`}
                            style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: '16px',
                              fontWeight: 700,
                              color: 'var(--ink)',
                              textDecoration: 'none',
                              lineHeight: '22px',
                            }}
                          >
                            {item.product_name}
                          </Link>
                          <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                            Configuration: <strong>{item.size || 'Standard'}</strong>
                            {item.color ? ` • Color: ${item.color}` : ''}
                            {item.sku ? ` (SKU: ${item.sku})` : ''}
                          </div>
                        </div>

                        {/* Price Column */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <Price price={item.price * item.quantity} mrp={item.mrp * item.quantity} isPaise size="md" />
                          {item.quantity > 1 && (
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                              ₹{Math.round(item.price / 100).toLocaleString('en-IN')} each
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stepper & Remove Action */}
                      <div
                        style={{
                          marginTop: 'var(--space-16)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}>
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(newQty) => updateQuantity(item.id, newQty)}
                            min={1}
                            max={Math.min(10, item.available || 10)}
                            disabled={isLoading}
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={isLoading}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: 0,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Remove
                          </button>
                        </div>

                        {item.available !== undefined && item.available <= 3 && (
                          <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>
                            Only {item.available} units remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div style={{ marginTop: 'var(--space-24)' }}>
                <Link
                  to="/shop"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    textDecoration: 'none',
                  }}
                >
                  ← Continue Exploring Catalog
                </Link>
              </div>
            </div>

            {/* ========================================================== */}
            {/* RIGHT: ORDER SUMMARY (THE ONLY CARD ON THIS PAGE) */}
            {/* ========================================================== */}
            <div
              style={{
                position: 'sticky',
                top: '100px',
                backgroundColor: 'var(--paper)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-24)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                  margin: '0 0 var(--space-20) 0',
                  paddingBottom: 'var(--space-12)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Order Summary
              </h3>

              {/* Coupon Section */}
              <div style={{ marginBottom: 'var(--space-20)' }}>
                {coupon ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--primary-light)',
                      border: '1px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                        Coupon Applied
                      </div>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>
                        {coupon.code}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      disabled={couponLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <Input
                        placeholder="Promotional code (e.g. WELCOME10)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ height: '40px' }}
                      />
                    </div>
                    <Button size="md" variant="secondary" type="submit" isLoading={couponLoading}>
                      Apply
                    </Button>
                  </form>
                )}

                {couponError && (
                  <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px', fontWeight: 500 }}>
                    {couponError}
                  </div>
                )}
              </div>

              {/* Cost Calculations */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-12)',
                  paddingBottom: 'var(--space-20)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 'var(--space-20)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <Price price={subtotal} isPaise size="sm" />
                </div>

                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--success)' }}>
                    <span>Promotional Discount</span>
                    <span>-₹{Math.round(discount / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>Estimated Shipping</span>
                  {shipping_fee === 0 ? (
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
                  ) : (
                    <Price price={shipping_fee} isPaise size="sm" />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--muted)' }}>Estimated GST (18%)</span>
                  <Price price={tax} isPaise size="sm" />
                </div>
              </div>

              {/* Total Calculation */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 'var(--space-24)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                  }}
                >
                  Grand Total
                </span>
                <Price price={total} isPaise size="hero" />
              </div>

              {/* Checkout Button */}
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', marginBottom: 'var(--space-16)' }}
              >
                Proceed to Checkout →
              </Button>

              {/* Trust Micro-Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  textAlign: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Encrypted 256-Bit Razorpay Test Checkout</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
