import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Price, Rating, Badge, Button, useToast } from '../ui/index.js';
import { useWishlistStore } from '../../store/wishlistStore.js';
import { useCartStore } from '../../store/cartStore.js';
import { eventsApi } from '../../api/events.js';

export function ProductTile({ product, onAddToCartSuccess }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast } = useToast();

  const isWishlisted = useWishlistStore((state) => state.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggleWishlist);
  const addToCart = useCartStore((state) => state.addToCart);

  // Images
  const img1 = product.image_urls?.[0] || 'https://picsum.photos/seed/default/600/600';
  const img2 = product.image_urls?.[1] || img1;

  // Selected variant for quick add to cart: pick the first with stock > 0, or the first variant
  const defaultVariant =
    product.variants?.find((v) => (v.available ?? v.quantity_on_hand) > 0) ||
    product.variants?.[0];

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await toggleWishlist(product);
      if (res.wishlisted) {
        showToast(`Added "${product.name}" to your wishlist`, 'success');
      } else {
        showToast(`Removed from your wishlist`, 'neutral');
      }
    } catch {
      showToast('Could not update wishlist. Please try again.', 'error');
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!defaultVariant) {
      showToast('Product variant currently unavailable', 'warning');
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(defaultVariant.id, 1);
      showToast(`Added ${product.name} to cart!`, 'success');
      eventsApi.track('add_to_cart', {
        productId: product.id,
        variantId: defaultVariant.id,
        name: product.name,
        price: defaultVariant.price || product.base_price,
      });
      if (onAddToCartSuccess) onAddToCartSuccess(product);
    } catch (err) {
      showToast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'var(--paper)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        transition: 'all var(--transition-normal)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'none',
        transform: isHovered ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Media Box */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          backgroundColor: 'var(--paper-subtle)',
        }}
      >
        <Link
          to={`/product/${product.slug}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
        >
          {/* Primary image */}
          <img
            src={img1}
            alt={product.name}
            loading="lazy"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              opacity: isHovered && img2 !== img1 ? 0 : 1,
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
            }}
          />

          {/* Secondary image (crossfades on hover) */}
          {img2 && img2 !== img1 && (
            <img
              src={img2}
              alt={`${product.name} alternate view`}
              loading="lazy"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          )}
        </Link>

        {/* Top badges */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {product.mrp > product.base_price && (
            <Badge variant="pink">
              {Math.round(((product.mrp - product.base_price) / product.mrp) * 100)}% OFF
            </Badge>
          )}
          {product.brand && <Badge variant="neutral">{product.brand}</Badge>}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 3,
            transition: 'all var(--transition-fast)',
            color: isWishlisted ? 'var(--pink)' : 'var(--muted)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.color = 'var(--pink)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.color = isWishlisted ? 'var(--pink)' : 'var(--muted)';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isWishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        {/* Quick Add to Cart Bar (Reveals on Hover) */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            zIndex: 3,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
            pointerEvents: isHovered ? 'auto' : 'none',
          }}
        >
          <Button
            size="sm"
            variant="primary"
            isLoading={isAdding}
            onClick={handleQuickAdd}
            style={{
              width: '100%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              backgroundColor: 'var(--ink)',
              color: '#ffffff',
            }}
          >
            + Quick Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Content Details */}
      <div
        style={{
          padding: 'var(--space-16)',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            marginBottom: '4px',
          }}
        >
          {product.category_name || 'Hardware'}
        </span>

        <Link
          to={`/product/${product.slug}`}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: '20px',
            color: 'var(--ink)',
            textDecoration: 'none',
            marginBottom: 'var(--space-8)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '40px',
            transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--ink)';
          }}
        >
          {product.name}
        </Link>

        {/* Rating preview */}
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <Rating value={4.8} count={28} size="sm" />
        </div>

        {/* Price & MRP with Pink Badge */}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
          <Price
            price={product.base_price}
            mrp={product.mrp}
            isPaise
            size="md"
          />
        </div>
      </div>
    </div>
  );
}

export default ProductTile;
