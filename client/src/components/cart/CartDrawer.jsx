import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Drawer, Price, QuantityStepper, Button, EmptyState } from '../ui/index.js';
import { useCartStore } from '../../store/cartStore.js';

export function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    items,
    count,
    subtotal,
    free_shipping_threshold,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCartStore();

  const missingForFreeShipping = Math.max(0, free_shipping_threshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / free_shipping_threshold) * 100)
  );

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Your Bag (${count})`}
      position="right"
      width="440px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Free Shipping Progress Line */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--paper-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-20)',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: '6px',
            }}
          >
            {missingForFreeShipping === 0 ? (
              <span style={{ color: 'var(--success)' }}>
                🎉 You've unlocked FREE Express Air Shipping!
              </span>
            ) : (
              <span>
                Add{' '}
                <strong style={{ color: 'var(--primary)' }}>
                  ₹{Math.ceil(missingForFreeShipping / 100).toLocaleString('en-IN')}
                </strong>{' '}
                more for free priority shipping
              </span>
            )}
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
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

        {/* Cart Items List */}
        {items.length === 0 ? (
          <div style={{ margin: 'auto 0' }}>
            <EmptyState
              title="Your bag is empty"
              description="Explore reference headphones, custom mechanical keyboards, and workspace tools."
              actionText="Explore Collection"
              onAction={() => {
                onClose();
                navigate('/shop');
              }}
            />
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-16)',
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-12)',
                  paddingBottom: 'var(--space-16)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {/* Thumbnail */}
                <Link
                  to={`/product/${item.slug}`}
                  onClick={onClose}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-sm)',
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

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={onClose}
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        lineHeight: '18px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.product_name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '14px',
                      }}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Variant info */}
                  <div style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 8px' }}>
                    {item.size || ''} {item.color ? `• ${item.color}` : ''}
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(newQty) => updateQuantity(item.id, newQty)}
                      min={1}
                      max={Math.min(10, item.available || 10)}
                      size="sm"
                    />
                    <Price price={item.price * item.quantity} isPaise size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div
            style={{
              paddingTop: 'var(--space-16)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted)' }}>
                Estimated Subtotal
              </span>
              <Price price={subtotal} isPaise size="lg" />
            </div>

            <Button size="lg" variant="primary" onClick={handleCheckoutClick} style={{ width: '100%' }}>
              Proceed to Checkout →
            </Button>

            <Button
              size="md"
              variant="ghost"
              onClick={handleViewCartClick}
              style={{ width: '100%', color: 'var(--muted)' }}
            >
              View Full Cart & Apply Coupons
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default CartDrawer;
