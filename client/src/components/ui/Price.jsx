import React from 'react';
import { Badge } from './Badge.jsx';
import { formatINR } from '../../utils/format.js';

/**
 * Price component conforming strictly to design requirement:
 * "shows price, struck-through MRP, and a % off badge in pink"
 *
 * @param {Object} props
 * @param {number} props.price - Selling price (in paise or rupees)
 * @param {number} [props.mrp] - Maximum retail price (in paise or rupees)
 * @param {boolean} [props.isPaise=true] - Defaults to true for backend paise values
 * @param {'sm' | 'md' | 'lg' | 'hero'} [props.size='md']
 */
export function Price({
  price = 0,
  mrp = null,
  isPaise = true,
  size = 'md',
  className = '',
  style = {},
}) {
  const normalPrice = isPaise ? price / 100 : price;
  const normalMrp = mrp ? (isPaise ? mrp / 100 : mrp) : null;

  const hasDiscount = normalMrp && normalMrp > normalPrice;
  const discountPercent = hasDiscount
    ? Math.round(((normalMrp - normalPrice) / normalMrp) * 100)
    : 0;

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return { price: '15px', mrp: '13px' };
      case 'lg':
        return { price: '24px', mrp: '16px' };
      case 'hero':
        return { price: '32px', mrp: '20px' };
      case 'md':
      default:
        return { price: '18px', mrp: '14px' };
    }
  };

  const fontSizes = getFontSize();

  return (
    <div
      className={`price-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 'var(--space-8)',
        flexWrap: 'wrap',
        fontFamily: 'var(--font-heading)',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: fontSizes.price,
          fontWeight: 'var(--fw-heavy)',
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}
      >
        {formatINR(normalPrice)}
      </span>

      {hasDiscount && (
        <>
          <del
            style={{
              fontSize: fontSizes.mrp,
              fontWeight: 'var(--fw-regular)',
              color: 'var(--muted)',
              textDecoration: 'line-through',
            }}
          >
            {formatINR(normalMrp)}
          </del>

          <Badge variant="pink" size={size === 'sm' ? 'sm' : 'md'}>
            {discountPercent}% OFF
          </Badge>
        </>
      )}
    </div>
  );
}

export default Price;
