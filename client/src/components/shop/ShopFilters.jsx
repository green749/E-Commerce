import React from 'react';
import { Checkbox, Button } from '../ui/index.js';

const POPULAR_BRANDS = [
  'Sennheiser',
  'Keychron',
  'Beyerdynamic',
  'Audio-Technica',
  'Sony',
  'Grovemade',
  'Drop',
  'Bose',
  'Nordic Craft',
];

const POPULAR_SIZES = ['Compact', 'Full Size', 'Standard', '1.0 Meter', '2.0 Meter', 'Tenkeyless'];

const COLOR_SWATCHES = [
  { name: 'Black', hex: '#111827' },
  { name: 'Silver', hex: '#E5E7EB' },
  { name: 'Space Gray', hex: '#4B5563' },
  { name: 'Walnut', hex: '#78350F' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Olive', hex: '#4D7C0F' },
];

export function ShopFilters({
  categories = [],
  filters = {},
  onFilterChange,
  onClearAll,
  onApply,
  isMobile = false,
}) {
  const {
    category = '',
    min_price = '',
    max_price = '',
    brand = '',
    size = '',
    color = '',
    on_sale = false,
    in_stock = false,
  } = filters;

  const hasActiveFilters = Boolean(
    category || min_price || max_price || brand || size || color || on_sale || in_stock
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Header with Clear Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-16)',
          borderBottom: '1px solid var(--border)',
          marginBottom: 'var(--space-16)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '15px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
          }}
        >
          Filters
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--primary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Reset all
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div
        style={{
          paddingBottom: 'var(--space-20)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-20)',
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--ink)',
            marginBottom: 'var(--space-12)',
          }}
        >
          Categories
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            onClick={() => onFilterChange('category', '')}
            style={{
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px 0',
              fontWeight: !category ? 700 : 500,
              color: !category ? 'var(--primary)' : 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'color var(--transition-fast)',
            }}
          >
            <span>All Categories</span>
            {!category && <span style={{ fontSize: '12px' }}>✓</span>}
          </div>
          {categories.map((cat) => {
            const isSelected = category === cat.slug;
            return (
              <div
                key={cat.id || cat.slug}
                onClick={() => onFilterChange('category', isSelected ? '' : cat.slug)}
                style={{
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--primary)' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>{cat.name}</span>
                {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range Slider */}
      <div
        style={{
          paddingBottom: 'var(--space-20)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-20)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-12)',
          }}
        >
          <h4
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Max Price
          </h4>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--primary)',
            }}
          >
            {max_price ? `₹${Number(max_price).toLocaleString('en-IN')}` : '₹1,00,000+'}
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="1000"
          max="100000"
          step="1000"
          value={max_price || 100000}
          onChange={(e) => onFilterChange('max_price', e.target.value === '100000' ? '' : e.target.value)}
          style={{
            width: '100%',
            accentColor: 'var(--primary)',
            cursor: 'pointer',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--muted)',
            marginTop: '4px',
          }}
        >
          <span>₹1,000</span>
          <span>₹50,000</span>
          <span>₹1,00,000+</span>
        </div>
      </div>

      {/* 3. Availability & Deals Toggles */}
      <div
        style={{
          paddingBottom: 'var(--space-20)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-20)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-12)',
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Stock & Offers
        </h4>
        <Checkbox
          label="On Sale"
          description="Discounted below regular MRP"
          checked={Boolean(on_sale)}
          onChange={(e) => onFilterChange('on_sale', e.target.checked ? 'true' : '')}
        />
        <Checkbox
          label="In Stock Only"
          description="Available for immediate dispatch"
          checked={Boolean(in_stock)}
          onChange={(e) => onFilterChange('in_stock', e.target.checked ? 'true' : '')}
        />
      </div>

      {/* 4. Brand Filter */}
      <div
        style={{
          paddingBottom: 'var(--space-20)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-20)',
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--ink)',
            marginBottom: 'var(--space-12)',
          }}
        >
          Brand
        </h4>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {POPULAR_BRANDS.map((b) => {
            const isSelected = brand.toLowerCase() === b.toLowerCase();
            return (
              <div
                key={b}
                onClick={() => onFilterChange('brand', isSelected ? '' : b)}
                style={{
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--primary)' : 'var(--ink)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'color var(--transition-fast)',
                }}
              >
                <span>{b}</span>
                {isSelected && <span style={{ fontSize: '12px' }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Color Swatches */}
      <div
        style={{
          paddingBottom: 'var(--space-20)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-20)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-12)',
          }}
        >
          <h4
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Color
          </h4>
          {color && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
              {color}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = color.toLowerCase() === swatch.name.toLowerCase();
            return (
              <button
                key={swatch.name}
                type="button"
                onClick={() => onFilterChange('color', isSelected ? '' : swatch.name)}
                title={swatch.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: swatch.hex,
                  border: isSelected
                    ? '2.5px solid var(--primary)'
                    : '1.5px solid var(--border-strong)',
                  boxShadow: isSelected ? '0 0 0 2px var(--paper), 0 0 0 4px var(--primary)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                  transition: 'transform var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: swatch.hex === '#FFFFFF' || swatch.hex === '#E5E7EB' ? '#111827' : '#FFFFFF',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Size Filter */}
      <div style={{ paddingBottom: 'var(--space-16)' }}>
        <h4
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--ink)',
            marginBottom: 'var(--space-12)',
          }}
        >
          Size / Spec
        </h4>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {POPULAR_SIZES.map((s) => {
            const isSelected = size.toLowerCase() === s.toLowerCase();
            return (
              <button
                key={s}
                type="button"
                onClick={() => onFilterChange('size', isSelected ? '' : s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--paper)',
                  color: isSelected ? 'var(--primary)' : 'var(--ink)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Apply Button */}
      {isMobile && (
        <div style={{ marginTop: 'var(--space-24)', paddingTop: 'var(--space-16)', borderTop: '1px solid var(--border)' }}>
          <Button size="lg" variant="primary" onClick={onApply} style={{ width: '100%' }}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default ShopFilters;
