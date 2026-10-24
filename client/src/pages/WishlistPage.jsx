import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout.jsx';
import { Price, Badge, Button, Skeleton, useToast } from '../components/ui/index.js';
import { useWishlistStore } from '../store/wishlistStore.js';
import { useCartStore } from '../store/cartStore.js';
import { wishlistApi } from '../api/wishlist.js';
import { catalogApi } from '../api/catalog.js';

export function WishlistPage() {
  const toast = useToast();
  const { fetchWishlist, toggleWishlist } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingItemId, setMovingItemId] = useState(null);
  const [error, setError] = useState(null);

  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await wishlistApi.getWishlist();
      const list = Array.isArray(res) ? res : res.items || [];
      setWishlistItems(list);
      await fetchWishlist(); // sync store count
    } catch (err) {
      setError(err.message || 'Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  }, [fetchWishlist]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleMoveToCart = async (item) => {
    setMovingItemId(item.id || item.product_id);
    try {
      // Fetch product details with variants to get the default variant ID
      let variantId = null;
      try {
        const prodData = await catalogApi.getProduct(item.slug);
        const activeVariant =
          prodData.variants?.find((v) => (v.available ?? v.quantity_on_hand) > 0) ||
          prodData.variants?.[0];
        if (activeVariant) {
          variantId = activeVariant.id;
        }
      } catch {
        // Fallback if variant fetch fails
      }

      if (!variantId) {
        toast.error('Unable to find available variant for this product', 'Move to Cart');
        setMovingItemId(null);
        return;
      }

      // 1. Add to cart
      await addToCart(variantId, 1);

      // 2. Remove from wishlist
      await wishlistApi.removeItem(item.product_id || item.id);
      await toggleWishlist({ id: item.product_id || item.id });

      // Update local state
      setWishlistItems((prev) =>
        prev.filter((i) => (i.product_id || i.id) !== (item.product_id || item.id))
      );

      toast.success(`Moved "${item.name}" to your shopping cart.`, 'Cart Updated');
    } catch (err) {
      toast.error(err.message || 'Failed to move product to cart', 'Error');
    } finally {
      setMovingItemId(null);
    }
  };

  const handleRemoveFromWishlist = async (item) => {
    try {
      await wishlistApi.removeItem(item.product_id || item.id);
      await toggleWishlist({ id: item.product_id || item.id });
      setWishlistItems((prev) =>
        prev.filter((i) => (i.product_id || i.id) !== (item.product_id || item.id))
      );
      toast.info(`Removed "${item.name}" from your wishlist.`, 'Wishlist Updated');
    } catch (err) {
      toast.error(err.message || 'Failed to remove from wishlist', 'Error');
    }
  };

  return (
    <AccountLayout
      title="Saved Wishlist"
      subtitle="Audiophile headphones, mechanical keyboards, and desk equipment you have bookmarked."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Account', href: '/account' },
        { label: 'Wishlist' },
      ]}
    >
      <div>
        {/* Loading Skeletons */}
        {isLoading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-24)',
            }}
          >
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
            <Skeleton height="320px" borderRadius="var(--radius-lg)" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div
            style={{
              padding: 'var(--space-24)',
              color: 'var(--danger)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && wishlistItems.length === 0 && (
          <div style={{ padding: 'var(--space-48) 0', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '8px' }}>
              Your wishlist is currently empty
            </h3>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: '14px',
                maxWidth: '400px',
                margin: '0 auto 24px',
              }}
            >
              Browse our catalog of audiophile sound gear, studio monitors, and precision mechanicals to save items for later.
            </p>
            <Link to="/shop" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Explore Store Catalog</Button>
            </Link>
          </div>
        )}

        {/* Product Tiles Grid with Move to Cart */}
        {!isLoading && !error && wishlistItems.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 'var(--space-24)',
            }}
          >
            {wishlistItems.map((item) => {
              const image =
                item.image_urls?.[0] || 'https://picsum.photos/seed/wishlist/500/500';
              const isMoving = movingItemId === (item.id || item.product_id);

              return (
                <div
                  key={item.id || item.product_id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--paper)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {/* Media Aspect Container */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1 / 1',
                      backgroundColor: 'var(--paper-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <Link
                      to={`/product/${item.slug}`}
                      style={{ display: 'block', width: '100%', height: '100%' }}
                    >
                      <img
                        src={image}
                        alt={item.name}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform var(--transition-normal)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    </Link>

                    {/* Stock Status Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 2,
                      }}
                    >
                      <Badge variant={item.in_stock ? 'success' : 'danger'}>
                        {item.in_stock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </div>

                    {/* Remove Wishlist Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromWishlist(item)}
                      title="Remove from wishlist"
                      aria-label="Remove item from wishlist"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid var(--border)',
                        color: 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 2,
                        transition: 'transform var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Content Details */}
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
                        letterSpacing: '0.05em',
                        color: 'var(--muted)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.brand || item.category?.name || 'Hardware'}
                    </span>

                    <Link
                      to={`/product/${item.slug}`}
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        textDecoration: 'none',
                        marginBottom: '8px',
                        lineHeight: '20px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '40px',
                      }}
                    >
                      {item.name}
                    </Link>

                    <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <Price
                        price={item.base_price}
                        mrp={item.mrp}
                        isPaise
                        size="md"
                      />

                      {/* Move to Cart Action Button */}
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!item.in_stock}
                        isLoading={isMoving}
                        onClick={() => handleMoveToCart(item)}
                        style={{ width: '100%' }}
                      >
                        {item.in_stock ? '🛒 Move to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export default WishlistPage;
