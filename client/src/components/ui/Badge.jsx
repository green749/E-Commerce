import React from 'react';

/**
 * Reusable Badge component with pill radii and status color tokens
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  style = {},
  ...rest
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'pink':
      case 'sale':
        return {
          backgroundColor: 'var(--pink-light)',
          color: 'var(--pink)',
        };
      case 'success':
        return {
          backgroundColor: 'var(--success-light)',
          color: 'var(--success)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--warning-light)',
          color: 'var(--warning)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
        };
      case 'bestseller':
      case 'sun':
        return {
          backgroundColor: 'var(--sun-light)',
          color: '#946e00',
        };
      case 'neutral':
        return {
          backgroundColor: 'var(--border-subtle)',
          color: 'var(--slate)',
        };
      case 'primary':
      case 'default':
      default:
        return {
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
        };
    }
  };

  const isSm = size === 'sm';

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'var(--font-heading)',
        fontSize: isSm ? '10px' : '11px',
        fontWeight: 'var(--fw-heavy)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: isSm ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-pill)',
        lineHeight: '14px',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...getVariantStyles(),
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

export default Badge;
