import React, { useState } from 'react';

/**
 * Reusable Input component with label, error, helperText, and icon slots
 */
export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  type = 'text',
  disabled = false,
  className = '',
  style = {},
  inputStyle = {},
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

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
          htmlFor={inputId}
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
          overflow: 'hidden',
        }}
      >
        {leftIcon && (
          <div
            style={{
              paddingLeft: 'var(--space-16)',
              display: 'flex',
              alignItems: 'center',
              color: isFocused ? 'var(--primary)' : 'var(--muted)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
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
            paddingLeft: leftIcon ? 'var(--space-8)' : 'var(--space-16)',
            paddingRight: rightIcon ? 'var(--space-8)' : 'var(--space-16)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--fs-body)',
            color: 'var(--ink)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            boxSizing: 'border-box',
            ...inputStyle,
          }}
          {...rest}
        />

        {rightIcon && (
          <div
            style={{
              paddingRight: 'var(--space-16)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--muted)',
            }}
          >
            {rightIcon}
          </div>
        )}
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
        <span
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--muted)',
            marginTop: '2px',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
}

export default Input;
