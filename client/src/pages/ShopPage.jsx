import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Breadcrumbs, Select, Pagination, Drawer, EmptyState, Button } from '../components/ui/index.js';
import { ProductTile, ProductTileSkeleton } from '../components/product/index.js';
import { ShopFilters } from '../components/shop/ShopFilters.jsx';
import { catalogApi } from '../api/catalog.js';
import { eventsApi } from '../api/events.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
];

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract filters from URL
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const brand = searchParams.get('brand') || '';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const onSale = searchParams.get('on_sale') || '';
  const inStock = searchParams.get('in_stock') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const filterValues = useMemo(
    () => ({
      category,
      min_price: minPrice,
      max_price: maxPrice,
      brand,
      size,
      color,
      on_sale: onSale,
      in_stock: inStock,
    }),
    [category, minPrice, maxPrice, brand, size, color, onSale, inStock]
  );

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (category) count++;
    if (minPrice || maxPrice) count++;
    if (brand) count++;
    if (size) count++;
    if (color) count++;
    if (onSale) count++;
    if (inStock) count++;
    return count;
  }, [category, minPrice, maxPrice, brand, size, color, onSale, inStock]);

  // Track page_view
  useEffect(() => {
    eventsApi.track('page_view', {
      page: '/shop',
      search: window.location.search,
      title: 'Shop Catalog',
    });
  }, [category, sort]);

  // Fetch Categories for Filter Sidebar
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    staleTime: 1000 * 60 * 10,
  });

  // Convert filter state to API parameters (prices in paise)
  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: 12,
      sort,
    };
    if (category) params.category = category;
    if (q) params.q = q;
    if (brand) params.brand = brand;
    if (size) params.size = size;
    if (color) params.color = color;
    if (onSale) params.on_sale = 'true';
    if (inStock) params.in_stock = 'true';
    if (minPrice) params.min_price = Number(minPrice) * 100;
    if (maxPrice) params.max_price = Number(maxPrice) * 100;
    return params;
  }, [page, sort, category, q, brand, size, color, onSale, inStock, minPrice, maxPrice]);

  // Fetch Products via TanStack Query
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => catalogApi.getProducts(queryParams),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  // Track search event once query finishes if q is present
  const lastTrackedQuery = useRef('');
  useEffect(() => {
    if (q && q.trim() && q !== lastTrackedQuery.current && productsData) {
      lastTrackedQuery.current = q;
      eventsApi.track('search', {
        query: q,
        results_count: productsData.pagination?.total || 0,
      });
    }
  }, [q, productsData]);

  // Helper to update URL search parameters
  const updateFilters = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    // Reset to page 1 on filter modification
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleClearAll = () => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set('q', q);
    if (sort) nextParams.set('sort', sort);
    setSearchParams(nextParams);
    setIsMobileFilterOpen(false);
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const items = productsData?.items || [];
  const pagination = productsData?.pagination || { total: 0, totalPages: 1 };
  const currentCategoryObj = categories.find((c) => c.slug === category);

  return (
    <div style={{ backgroundColor: 'var(--paper)', minHeight: '80vh', paddingBottom: 'var(--space-64)' }}>
      {/* 1. Shop Top Header & Breadcrumbs */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper-subtle)',
          padding: 'var(--space-24) 0',
        }}
      >
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop Catalog', href: '/shop' },
              ...(currentCategoryObj
                ? [{ label: currentCategoryObj.name }]
                : category
                  ? [{ label: category }]
                  : []),
              ...(q ? [{ label: `Search: "${q}"` }] : []),
            ]}
          />

          <div style={{ marginTop: 'var(--space-16)' }}>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {q
                ? `Results for "${q}"`
                : currentCategoryObj
                  ? currentCategoryObj.name
                  : 'All Precision Hardware & Gear'}
            </h1>
            <p
              style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--muted)',
                marginTop: '6px',
                marginBottom: 0,
              }}
            >
              {currentCategoryObj
                ? `Explore our high-performance collection of ${currentCategoryObj.name.toLowerCase()}.`
                : 'Engineered open-back headphones, CNC mechanical keyboards, and workspace architecture.'}
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 'var(--space-32)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-48)', alignItems: 'flex-start' }}>
          {/* 2. DESKTOP LEFT FILTER SIDEBAR (NO CARD, USES DIVIDERS) */}
          <aside
            className="desktop-filter-sidebar"
            style={{
              width: '260px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ShopFilters
              categories={categories}
              filters={filterValues}
              onFilterChange={updateFilters}
              onClearAll={handleClearAll}
            />
          </aside>

          {/* 3. MAIN CATALOG AREA */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Top Bar: Result count, Sort dropdown, and Mobile Filter Trigger */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-16)',
                paddingBottom: 'var(--space-20)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-24)',
              }}
            >
              {/* Left: Result count summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="mobile-filter-trigger"
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--paper)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                  </svg>
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <span
                  style={{
                    fontSize: 'var(--fs-small)',
                    color: 'var(--muted)',
                    fontWeight: 500,
                  }}
                >
                  {isLoading ? (
                    'Searching catalog...'
                  ) : (
                    <>
                      Showing <strong style={{ color: 'var(--ink)' }}>{items.length}</strong> of{' '}
                      <strong style={{ color: 'var(--ink)' }}>{pagination.total}</strong> products
                    </>
                  )}
                </span>
              </div>

              {/* Right: Sort Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Sort By:
                </span>
                <div style={{ width: '180px' }}>
                  <Select
                    options={SORT_OPTIONS}
                    value={sort}
                    onChange={(e) => updateFilters('sort', e.target.value)}
                    selectStyle={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            {/* Active Filter Tags Bar (if any active filters) */}
            {activeFilterCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-24)',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                  Active:
                </span>
                {category && (
                  <span
                    onClick={() => updateFilters('category', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Category: {currentCategoryObj?.name || category} ✕
                  </span>
                )}
                {brand && (
                  <span
                    onClick={() => updateFilters('brand', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Brand: {brand} ✕
                  </span>
                )}
                {color && (
                  <span
                    onClick={() => updateFilters('color', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Color: {color} ✕
                  </span>
                )}
                {size && (
                  <span
                    onClick={() => updateFilters('size', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Size: {size} ✕
                  </span>
                )}
                {maxPrice && (
                  <span
                    onClick={() => updateFilters('max_price', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    Max: ₹{Number(maxPrice).toLocaleString('en-IN')} ✕
                  </span>
                )}
                {onSale && (
                  <span
                    onClick={() => updateFilters('on_sale', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--pink-light)',
                      border: '1px solid var(--pink)',
                      fontSize: '12px',
                      color: 'var(--pink)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    On Sale ✕
                  </span>
                )}
                {inStock && (
                  <span
                    onClick={() => updateFilters('in_stock', '')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--paper-subtle)',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    In Stock ✕
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    padding: '0 4px',
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* 4. Error State */}
            {isError && (
              <div
                style={{
                  padding: 'var(--space-32)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--danger-light)',
                  border: '1px solid var(--danger)',
                  color: 'var(--ink)',
                  textAlign: 'center',
                  marginBottom: 'var(--space-32)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  Unable to load products
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '16px' }}>
                  {error?.message || 'A network error occurred while communicating with the catalog.'}
                </p>
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Retry Connection
                </Button>
              </div>
            )}

            {/* 5. Product Grid & Skeleton State */}
            {isLoading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 'var(--space-24)',
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                  <ProductTileSkeleton key={i} />
                ))}
              </div>
            ) : items.length === 0 ? (
              /* 6. Empty Results State */
              <EmptyState
                title="No matching products found"
                description={
                  q
                    ? `We could not find any products matching "${q}". Try adjusting your search or resetting filters.`
                    : 'No products match the selected combination of category, price, brand, and color filters.'
                }
                actionText="Reset All Filters"
                onAction={handleClearAll}
              />
            ) : (
              /* Loaded Products Grid */
              <>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 'var(--space-24)',
                    marginBottom: 'var(--space-48)',
                  }}
                >
                  {items.map((prod) => (
                    <ProductTile key={prod.id} product={prod} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      page={page}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* 7. MOBILE FILTER BOTTOM SHEET (DRAWER) */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter & Refine"
        position="bottom"
      >
        <ShopFilters
          categories={categories}
          filters={filterValues}
          onFilterChange={updateFilters}
          onClearAll={handleClearAll}
          onApply={() => setIsMobileFilterOpen(false)}
          isMobile
        />
      </Drawer>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-filter-sidebar {
            display: none !important;
          }
          .mobile-filter-trigger {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ShopPage;
