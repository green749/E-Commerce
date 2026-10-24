import React, { useState } from 'react';

/**
 * Reusable Select dropdown component
 */
export function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  id,
  disabled = false,
  className = '',
  style = {},
  selectStyle = {},
  children,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        width: '100%',
        ...style,
      }}
      className={className}
    >
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--fs-small)',
            fontWeight: 'var(--fw-semibold)',
            color: error ? 'var(--danger)' : 'var(--ink)',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: disabled ? 'var(--border-subtle)' : 'var(--paper)',
          border: `1.5px solid ${error ? 'var(--danger)' : isFocused ? 'var(--primary)' : 'var(--border)'}`,
          boxShadow:
            error && isFocused
              ? 'var(--shadow-focus-ring-danger)'
              : isFocused
                ? 'var(--shadow-focus-ring)'
                : 'none',
          borderRadius: 'var(--radius-input)',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
      >
        <select
          id={selectId}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          style={{
            width: '100%',
            padding: '12px var(--space-16)',
            paddingRight: '40px',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body)',
            color: 'var(--ink)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            ...selectStyle,
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        {/* Custom Chevron Down Icon */}
        <div
          style={{
            position: 'absolute',
            right: 'var(--space-16)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            color: isFocused ? 'var(--primary)' : 'var(--muted)',
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
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {error && (
        <span
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--danger)',
            fontWeight: 'var(--fw-medium)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}

      {!error && helperText && (
        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)', marginTop: '2px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
}

export default Select;
