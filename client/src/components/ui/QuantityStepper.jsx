import React from 'react';

/**
 * QuantityStepper for carts and product pages (min/max bound checking)
 */
export function QuantityStepper({
  value = 1,
  onChange,
  min = 1,
  max = 10,
  disabled = false,
  size = 'md',
  className = '',
  style = {},
}) {
  const handleDecrement = (e) => {
    e.preventDefault();
    if (disabled || value <= min) return;
    onChange?.(value - 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    if (disabled || value >= max) return;
    onChange?.(value + 1);
  };

  const isSm = size === 'sm';
  const height = isSm ? '32px' : '40px';
  const btnWidth = isSm ? '30px' : '38px';

  return (
    <div
      className={`quantity-stepper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height,
        backgroundColor: 'var(--paper)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        overflow: 'hidden',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        style={{
          width: btnWidth,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
          color: disabled || value <= min ? 'var(--muted-light)' : 'var(--ink)',
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value > min)
            e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <span
        style={{
          minWidth: isSm ? '32px' : '40px',
          textAlign: 'center',
          fontFamily: 'var(--font-heading)',
          fontSize: isSm ? 'var(--fs-small)' : 'var(--fs-body)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--ink)',
        }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
        style={{
          width: btnWidth,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          cursor: disabled || value >= max ? 'not-allowed' : 'pointer',
          color: disabled || value >= max ? 'var(--muted-light)' : 'var(--ink)',
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!disabled && value < max)
            e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
}

export default QuantityStepper;
