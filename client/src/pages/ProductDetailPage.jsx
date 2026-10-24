import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumbs,
  Price,
  Rating,
  Badge,
  QuantityStepper,
  Button,
  Skeleton,
  EmptyState,
  useToast,
} from '../components/ui/index.js';
import { ProductTile } from '../components/product/index.js';
import { catalogApi } from '../api/catalog.js';
import { eventsApi } from '../api/events.js';
import { useCartStore } from '../store/cartStore.js';
import { useWishlistStore } from '../store/wishlistStore.js';

// Color name to Hex mapping for swatches
const COLOR_MAP = {
  black: '#111827',
  charcoal: '#262626',
  'braided charcoal': '#262626',
  silver: '#E5E7EB',
  white: '#FFFFFF',
  walnut: '#78350F',
  navy: '#1E3A8A',
  'space gray': '#4B5563',
  olive: '#4D7C0F',
  gold: '#D97706',
  'rose gold': '#FB7185',
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
};

function getColorHex(colorName) {
  if (!colorName) return '#111827';
  const clean = colorName.toLowerCase().trim();
  return COLOR_MAP[clean] || '#4B5563';
}

export function ProductDetailPage() {
  const { slug } = useParams();
  const { showToast } = useToast();

  const addToCart = useCartStore((s) => s.addToCart);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  // Active UI states
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50, isZoomed: false });
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState({
    description: true,
    specifications: false,
    delivery: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch product by slug
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.getProductBySlug(slug),
    staleTime: 1000 * 60 * 5,
  });

  // Track product_view event once product data is loaded
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (product?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      eventsApi.track('product_view', {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.base_price,
        brand: product.brand,
        category: product.category_slug,
      });
    }
  }, [product]);

  // Reset states when slug changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setSelectedVariantId(null);
    hasTrackedView.current = false;
  }, [slug]);

  // Variants list
  const variants = useMemo(() => product?.variants || [], [product]);

  // Set default variant on initial load
  useEffect(() => {
    if (variants.length > 0 && !selectedVariantId) {
      const availableVariant = variants.find((v) => (v.available ?? v.quantity_on_hand) > 0);
      setSelectedVariantId(availableVariant ? availableVariant.id : variants[0].id);
    }
  }, [variants, selectedVariantId]);

  // Currently selected variant
  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    return variants.find((v) => v.id === selectedVariantId) || variants[0];
  }, [variants, selectedVariantId]);

  // Distinct available colors and sizes
  const distinctColors = useMemo(() => {
    const map = new Map();
    variants.forEach((v) => {
      if (v.color && !map.has(v.color)) {
        map.set(v.color, v);
      }
    });
    return Array.from(map.entries()).map(([color, sampleVariant]) => ({
      color,
      sampleVariant,
      hasStock: variants.some((v) => v.color === color && (v.available ?? v.quantity_on_hand) > 0),
    }));
  }, [variants]);

  const distinctSizes = useMemo(() => {
    const map = new Map();
    variants.forEach((v) => {
      if (v.size && !map.has(v.size)) {
        map.set(v.size, v);
      }
    });
    return Array.from(map.entries()).map(([size, sampleVariant]) => ({
      size,
      sampleVariant,
      hasStock: variants.some((v) => v.size === size && (v.available ?? v.quantity_on_hand) > 0),
    }));
  }, [variants]);

  // Pricing & Stock
  const activePrice = activeVariant?.price ?? product?.base_price ?? 0;
  const activeMrp = activeVariant?.mrp ?? product?.mrp ?? 0;
  const activeAvailable = activeVariant?.available ?? 0;
  const isOutOfStock = activeAvailable <= 0;
  const isLowStock = activeAvailable > 0 && activeAvailable <= 5;

  // Images list
  const images = useMemo(() => {
    if (product?.image_urls && product.image_urls.length > 0) {
      return product.image_urls;
    }
    return ['https://picsum.photos/seed/default-pdp/800/800'];
  }, [product]);

  const activeImage = images[selectedImageIndex] || images[0];

  // Mouse zoom handlers
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y, isZoomed: true });
  };

  const handleMouseLeave = () => {
    setZoomPos({ x: 50, y: 50, isZoomed: false });
  };

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!activeVariant) return;

    if (activeAvailable <= 0) {
      showToast('This variant is currently out of stock', 'warning');
      return;
    }

    try {
      setIsAddingToCart(true);
      await addToCart(activeVariant.id, quantity);
      showToast(
        `Added ${quantity} × ${product.name} (${activeVariant.size || ''} ${activeVariant.color || ''}) to cart!`,
        'success'
      );
      eventsApi.track('add_to_cart', {
        productId: product.id,
        variantId: activeVariant.id,
        quantity,
        price: activePrice,
        name: product.name,
      });
    } catch (err) {
      showToast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Wishlist toggle handler
  const wishlisted = product ? isWishlisted(product.id) : false;
  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const res = await toggleWishlist(product);
      if (res.wishlisted) {
        showToast(`Added "${product.name}" to your wishlist`, 'success');
      } else {
        showToast('Removed from your wishlist', 'neutral');
      }
    } catch {
      showToast('Could not update wishlist', 'error');
    }
  };

  // Select color & update variant without page reload
  const handleSelectColor = (colorName) => {
    const match =
      variants.find(
        (v) =>
          v.color === colorName &&
          (!activeVariant?.size || v.size === activeVariant.size) &&
          (v.available ?? v.quantity_on_hand) > 0
      ) ||
      variants.find((v) => v.color === colorName) ||
      variants[0];

    if (match) {
      setSelectedVariantId(match.id);
      setQuantity(1);
    }
  };

  // Select size & update variant without page reload
  const handleSelectSize = (sizeName) => {
    const match =
      variants.find(
        (v) =>
          v.size === sizeName &&
          (!activeVariant?.color || v.color === activeVariant.color) &&
          (v.available ?? v.quantity_on_hand) > 0
      ) ||
      variants.find((v) => v.size === sizeName) ||
      variants[0];

    if (match) {
      setSelectedVariantId(match.id);
      setQuantity(1);
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="section" style={{ minHeight: '80vh' }}>
        <div className="container">
          <Skeleton width="220px" height="16px" style={{ marginBottom: 'var(--space-24)' }} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--space-48)',
            }}
          >
            <div style={{ aspectRatio: '1 / 1', width: '100%' }}>
              <Skeleton variant="rect" width="100%" height="100%" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
              <Skeleton width="30%" height="18px" />
              <Skeleton width="80%" height="36px" />
              <Skeleton width="40%" height="24px" />
              <Skeleton width="50%" height="40px" style={{ margin: 'var(--space-12) 0' }} />
              <Skeleton width="100%" height="80px" />
              <Skeleton width="100%" height="48px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !product) {
    return (
      <div className="section" style={{ minHeight: '70vh' }}>
        <div className="container">
          <EmptyState
            title="Product Not Found"
            description={
              error?.message ||
              'The requested hardware model could not be found or has been retired from the active catalog.'
            }
            actionText="Browse Available Products"
            actionHref="/shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--paper)', minHeight: '90vh', paddingBottom: 'var(--space-64)' }}>
      {/* 1. Breadcrumbs Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper-subtle)',
          padding: 'var(--space-16) 0',
        }}
      >
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              {
                label: product.category_name || 'Catalog',
                href: `/shop?category=${product.category_slug}`,
              },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="container" style={{ marginTop: 'var(--space-32)' }}>
        {/* Main Two-Column Layout (Open, No Card Boxes) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'var(--space-48)',
            alignItems: 'flex-start',
          }}
        >
          {/* ========================================================== */}
          {/* LEFT: IMAGE GALLERY WITH THUMBNAILS AND ZOOM */}
          {/* ========================================================== */}
          <div style={{ display: 'flex', gap: 'var(--space-16)', flexDirection: 'row-reverse' }}>
            {/* Main Stage Display Image */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                backgroundColor: 'var(--paper-subtle)',
                userSelect: 'none',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={activeImage}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  cursor: 'crosshair',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: zoomPos.isZoomed ? 'scale(2.2)' : 'scale(1)',
                  transition: zoomPos.isZoomed
                    ? 'transform-origin 0.05s ease-out'
                    : 'transform 0.3s ease',
                }}
              />

              {/* Floating badges on image */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  gap: '8px',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                {activeMrp > activePrice && (
                  <Badge variant="pink">
                    {Math.round(((activeMrp - activePrice) / activeMrp) * 100)}% OFF
                  </Badge>
                )}
                {product.brand && <Badge variant="neutral">{product.brand}</Badge>}
              </div>

              {/* Zoom hint overlay (fades on hover) */}
              {!zoomPos.isZoomed && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'rgba(15, 15, 26, 0.7)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  Hover to Zoom
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-12)',
                  width: '80px',
                  flexShrink: 0,
                }}
              >
                {images.map((img, idx) => {
                  const isSelected = idx === selectedImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      onMouseEnter={() => setSelectedImageIndex(idx)}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        overflow: 'hidden',
                        padding: 0,
                        backgroundColor: 'var(--paper)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isSelected ? 'var(--shadow-focus-ring)' : 'none',
                      }}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================== */}
          {/* RIGHT: BRAND, H1, RATING, PRICE, VARIANTS, QUANTITY, CTAS */}
          {/* ========================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Brand & Category row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: 'var(--space-8)',
              }}
            >
              <Link
                to={`/shop?brand=${encodeURIComponent(product.brand)}`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                {product.brand}
              </Link>
              <span style={{ color: 'var(--border-strong)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                {product.category_name}
              </span>
            </div>

            {/* Product Title (H1) */}
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
                color: 'var(--ink)',
                margin: '0 0 var(--space-12) 0',
              }}
            >
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-12)',
                marginBottom: 'var(--space-20)',
              }}
            >
              <Rating value={4.9} count={84} size="md" />
              <span style={{ color: 'var(--border-strong)' }}>•</span>
              <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>
                SKU: <strong style={{ color: 'var(--ink)' }}>{activeVariant?.sku || 'N/A'}</strong>
              </span>
            </div>

            {/* Price Block with Pink Badge */}
            <div
              style={{
                padding: 'var(--space-16) 0',
                borderTop: '1px solid var(--border-subtle)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-20)',
              }}
            >
              <Price price={activePrice} mrp={activeMrp} isPaise size="hero" />
            </div>

            {/* Live Stock Message */}
            <div style={{ marginBottom: 'var(--space-24)' }}>
              {isOutOfStock ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />
                  Out of Stock for this configuration
                </div>
              ) : isLowStock ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: '#FEF3C7',
                    color: '#B45309',
                    fontSize: '13px',
                    fontWeight: 700,
                    animation: 'pulse 2s infinite',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                  ⚡ Only {activeAvailable} left in stock - order soon!
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--success)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  In Stock ({activeAvailable} units available for express dispatch)
                </div>
              )}
            </div>

            {/* ========================================================== */}
            {/* VARIANT SELECTORS: COLOR SWATCHES & SIZE BUTTONS */}
            {/* ========================================================== */}

            {/* Color Swatches */}
            {distinctColors.length > 0 && (
              <div style={{ marginBottom: 'var(--space-20)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-8)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--ink)',
                    }}
                  >
                    Color: <strong style={{ color: 'var(--primary)' }}>{activeVariant?.color}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {distinctColors.map(({ color, hasStock }) => {
                    const isSelected = activeVariant?.color === color;
                    const hex = getColorHex(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleSelectColor(color)}
                        title={`${color}${!hasStock ? ' (Out of stock)' : ''}`}
                        style={{
                          position: 'relative',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: hex,
                          border: isSelected
                            ? '2.5px solid var(--primary)'
                            : '1.5px solid var(--border-strong)',
                          boxShadow: isSelected
                            ? '0 0 0 2px var(--paper), 0 0 0 4px var(--primary)'
                            : 'none',
                          cursor: 'pointer',
                          padding: 0,
                          outline: 'none',
                          transition: 'transform var(--transition-fast)',
                          opacity: !hasStock ? 0.45 : 1,
                        }}
                      >
                        {/* Out of stock diagonal line */}
                        {!hasStock && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: 0,
                              right: 0,
                              height: '2px',
                              backgroundColor: '#EF4444',
                              transform: 'rotate(-45deg)',
                            }}
                          />
                        )}
                        {isSelected && (
                          <span
                            style={{
                              display: 'block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              margin: 'auto',
                              backgroundColor: hex === '#FFFFFF' || hex === '#E5E7EB' ? '#111827' : '#FFFFFF',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Buttons */}
            {distinctSizes.length > 0 && (
              <div style={{ marginBottom: 'var(--space-24)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-8)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--ink)',
                    }}
                  >
                    Size / Spec:{' '}
                    <strong style={{ color: 'var(--primary)' }}>{activeVariant?.size}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {distinctSizes.map(({ size, hasStock }) => {
                    const isSelected = activeVariant?.size === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSelectSize(size)}
                        style={{
                          position: 'relative',
                          padding: '8px 18px',
                          borderRadius: 'var(--radius-pill)',
                          border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--paper)',
                          color: isSelected ? 'var(--primary)' : 'var(--ink)',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '13px',
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          opacity: !hasStock ? 0.5 : 1,
                          textDecoration: !hasStock ? 'line-through' : 'none',
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-16)',
                marginBottom: 'var(--space-24)',
                flexWrap: 'wrap',
              }}
            >
              <QuantityStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={Math.min(10, Math.max(1, activeAvailable))}
                disabled={isOutOfStock}
                size="md"
              />

              {/* Primary Add to Cart Button */}
              <Button
                size="lg"
                variant="primary"
                onClick={handleAddToCart}
                isLoading={isAddingToCart}
                disabled={isOutOfStock}
                style={{ flex: 1, minWidth: '220px' }}
              >
                {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
              </Button>

              {/* Secondary Add to Wishlist Button */}
              <Button
                size="lg"
                variant="secondary"
                onClick={handleToggleWishlist}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: wishlisted ? 'var(--pink)' : 'var(--ink)',
                  borderColor: wishlisted ? 'var(--pink)' : 'var(--border)',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <span>{wishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* BELOW: ACCORDIONS (NO CARDS, SIMPLE DIVIDERS) */}
        {/* ========================================================== */}
        <div style={{ marginTop: 'var(--space-64)', borderTop: '1px solid var(--border)' }}>
          {/* Accordion 1: Description */}
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('description')}
              style={{
                width: '100%',
                padding: 'var(--space-20) 0',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Product Overview & Acoustic Architecture
              </h3>
              <span
                style={{
                  fontSize: '20px',
                  color: 'var(--muted)',
                  transform: openAccordions.description ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                ▼
              </span>
            </button>
            {openAccordions.description && (
              <div
                style={{
                  paddingBottom: 'var(--space-24)',
                  fontSize: 'var(--fs-body)',
                  color: 'var(--slate)',
                  lineHeight: '28px',
                }}
              >
                <p style={{ marginTop: 0, marginBottom: 'var(--space-16)' }}>
                  {product.description}
                </p>
                <p style={{ margin: 0 }}>
                  Every component is stress-tested to aerospace tolerances. Designed for
                  mastering engineers and demanding audiophiles, the transducer delivers neutral
                  timbral reproduction and visceral transient speed without harmonic fatigue.
                </p>
              </div>
            )}
          </div>

          {/* Accordion 2: Technical Specifications */}
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('specifications')}
              style={{
                width: '100%',
                padding: 'var(--space-20) 0',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Technical Specifications & Compatibility
              </h3>
              <span
                style={{
                  fontSize: '20px',
                  color: 'var(--muted)',
                  transform: openAccordions.specifications ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                ▼
              </span>
            </button>
            {openAccordions.specifications && (
              <div style={{ paddingBottom: 'var(--space-24)' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 'var(--space-16)',
                  }}
                >
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Brand / Manufacturer
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      {product.brand}
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Active SKU
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      {activeVariant?.sku || 'N/A'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Color Finish
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      {activeVariant?.color || 'Standard'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Size / Configuration
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      {activeVariant?.size || 'Standard'}
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Official Warranty
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      2-Year Hardware Replacement
                    </div>
                  </div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Materials
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                      CNC Anodized Aluminum, OFC Copper
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: Delivery & Returns */}
          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => toggleAccordion('delivery')}
              style={{
                width: '100%',
                padding: 'var(--space-20) 0',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                }}
              >
                Complimentary Delivery & 7-Day Studio Returns
              </h3>
              <span
                style={{
                  fontSize: '20px',
                  color: 'var(--muted)',
                  transform: openAccordions.delivery ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                ▼
              </span>
            </button>
            {openAccordions.delivery && (
              <div
                style={{
                  paddingBottom: 'var(--space-24)',
                  fontSize: 'var(--fs-body)',
                  color: 'var(--slate)',
                  lineHeight: '26px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>• Free Priority Air Courier:</strong> All
                    orders over ₹999 ship via priority air express across India with real-time tracking
                    and insurance.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>• 7-Day Hassle-Free Trial:</strong> Put the
                    gear to work in your own setup. If it doesn't match your acoustics or tactile workflow,
                    request an instant doorstep pickup.
                  </div>
                  <div>
                    <strong style={{ color: 'var(--ink)' }}>• Genuine Guarantee:</strong> 100% brand
                    authorized inventory backed by serial registration and factory support.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* "YOU MAY ALSO LIKE" ROW (USING PRODUCT TILE) */}
        {/* ========================================================== */}
        {product.related_products && product.related_products.length > 0 && (
          <div style={{ marginTop: 'var(--space-64)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 'var(--space-32)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--muted)',
                  }}
                >
                  Curated Pairings
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--fs-h2)',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--ink)',
                    margin: '4px 0 0 0',
                  }}
                >
                  You May Also Like
                </h2>
              </div>
              <Link
                to={`/shop?category=${product.category_slug}`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--fs-small)',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                }}
              >
                View category →
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 'var(--space-24)',
              }}
            >
              {product.related_products.map((rel) => (
                <ProductTile key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* STICKY BOTTOM ADD-TO-CART BAR ON MOBILE */}
      {/* ========================================================== */}
      <div
        className="mobile-sticky-pdp-bar"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          backgroundColor: 'var(--paper)',
          borderTop: '1px solid var(--border)',
          boxShadow: 'var(--shadow-modal)',
          padding: '12px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <img
            src={activeImage}
            alt={product.name}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              objectFit: 'cover',
              border: '1px solid var(--border)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {product.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Price price={activePrice} isPaise size="sm" />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                ({activeVariant?.size || 'Standard'})
              </span>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleAddToCart}
          isLoading={isAddingToCart}
          disabled={isOutOfStock}
          style={{ flexShrink: 0 }}
        >
          {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
        </Button>
      </div>

      {/* Responsive media query for sticky bar */}
      <style>{`
        .mobile-sticky-pdp-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-sticky-pdp-bar {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductDetailPage;
