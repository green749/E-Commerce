import React from 'react';

/**
 * Rating component displaying star icons, numeric score, and review count
 */
export function Rating({
  value = 5,
  count = null,
  size = 'md',
  showValue = true,
  className = '',
  style = {},
}) {
  const isSm = size === 'sm';
  const starSize = isSm ? 13 : 16;
  const ratingNum = Math.min(5, Math.max(0, Number(value) || 0));

  return (
    <div
      className={`rating-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        userSelect: 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = ratingNum >= star;
          const isHalf = !isFull && ratingNum >= star - 0.5;

          return (
            <svg
              key={star}
              width={starSize}
              height={starSize}
              viewBox="0 0 24 24"
              fill={isFull ? 'var(--sun)' : isHalf ? 'url(#halfStarGrad)' : 'var(--border)'}
              stroke="none"
              style={{ flexShrink: 0 }}
            >
              <defs>
                <linearGradient id="halfStarGrad">
                  <stop offset="50%" stopColor="var(--sun)" />
                  <stop offset="50%" stopColor="var(--border)" />
                </linearGradient>
              </defs>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        })}
      </div>

      {showValue && (
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: isSm ? '12px' : 'var(--fs-small)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--ink)',
            marginLeft: '2px',
          }}
        >
          {ratingNum.toFixed(1)}
        </span>
      )}

      {count !== null && count !== undefined && (
        <span
          style={{
            fontSize: isSm ? '11px' : 'var(--fs-caption)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          ({count})
        </span>
      )}
    </div>
  );
}

export default Rating;
