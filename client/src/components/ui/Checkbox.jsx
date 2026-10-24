import React from 'react';

/**
 * Accessible Checkbox component with custom checkmark design
 */
export function Checkbox({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  error,
  id,
  className = '',
  style = {},
  ...rest
}) {
  const checkboxId =
    id ||
    (typeof label === 'string'
      ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`
      : undefined);

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', ...style }}
      className={className}
    >
      <label
        htmlFor={checkboxId}
        style={{
          display: 'inline-flex',
          alignItems: description ? 'flex-start' : 'center',
          gap: 'var(--space-8)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginTop: description ? '2px' : '0',
          }}
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            style={{
              position: 'absolute',
              opacity: 0,
              width: 0,
              height: 0,
              margin: 0,
            }}
            {...rest}
          />
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: 'var(--radius-xs)',
              border: `1.5px solid ${error ? 'var(--danger)' : checked ? 'var(--primary)' : 'var(--border-strong)'}`,
              backgroundColor: checked
                ? 'var(--primary)'
                : disabled
                  ? 'var(--border-subtle)'
                  : 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              flexShrink: 0,
            }}
          >
            {checked && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        </div>

        {(label || description) && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {label && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--fs-small)',
                  fontWeight: 'var(--fw-medium)',
                  color: disabled ? 'var(--muted-light)' : 'var(--ink)',
                  lineHeight: '18px',
                }}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)', marginTop: '2px' }}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>

      {error && (
        <span
          style={{
            fontSize: 'var(--fs-caption)',
            color: 'var(--danger)',
            fontWeight: 'var(--fw-medium)',
            paddingLeft: '26px',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default Checkbox;
