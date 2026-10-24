import React from 'react';

/**
 * Reusable Button component adhering to SHOPPE design tokens
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {React.ReactNode} props.children
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  style = {},
  type = 'button',
  ...rest
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: 'var(--ink)',
          border: '1.5px solid var(--ink)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--muted)',
          border: '1.5px solid transparent',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--primary)',
          border: '1.5px solid var(--primary)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger)',
          color: '#ffffff',
          border: '1.5px solid var(--danger)',
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          border: '1.5px solid var(--primary)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '8px 14px',
          fontSize: 'var(--fs-small)',
          borderRadius: 'var(--radius-sm)',
        };
      case 'lg':
        return {
          padding: '16px 32px',
          fontSize: '17px',
          borderRadius: 'var(--radius-btn)',
        };
      case 'md':
      default:
        return {
          padding: '12px 24px',
          fontSize: '15px',
          borderRadius: 'var(--radius-btn)',
        };
    }
  };

  const buttonStyles = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-8)',
    fontFamily: 'var(--font-heading)',
    fontWeight: 'var(--fw-bold)',
    letterSpacing: '-0.01em',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.55 : 1,
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    boxSizing: 'border-box',
    userSelect: 'none',
    position: 'relative',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      style={buttonStyles}
      className={`shoppe-btn shoppe-btn-${variant} shoppe-btn-${size} ${className}`}
      {...rest}
    >
      {isLoading && (
        <svg
          style={{
            animation: 'spin 0.8s linear infinite',
            width: size === 'sm' ? '14px' : '16px',
            height: size === 'sm' ? '14px' : '16px',
            flexShrink: 0,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.25"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {!isLoading && leftIcon && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{rightIcon}</span>
      )}
    </button>
  );
}

export default Button;
