import React, { useEffect } from 'react';

/**
 * Reusable slide-in Drawer component (supports right, left, and mobile bottom)
 */
export function Drawer({
  isOpen = false,
  onClose,
  title,
  children,
  position = 'right',
  width = '360px',
  className = '',
  style = {},
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBottom = position === 'bottom';
  const isLeft = position === 'left';

  const getDrawerStyles = () => {
    if (isBottom) {
      return {
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '80vh',
        width: '100%',
        borderTopLeftRadius: 'var(--radius-xl)',
        borderTopRightRadius: 'var(--radius-xl)',
        borderTop: '1px solid var(--border)',
        transform: 'translateY(0)',
      };
    }
    return {
      top: 0,
      bottom: 0,
      [isLeft ? 'left' : 'right']: 0,
      width: `min(${width}, 100vw)`,
      height: '100%',
      borderLeft: isLeft ? 'none' : '1px solid var(--border)',
      borderRight: isLeft ? '1px solid var(--border)' : 'none',
      transform: 'translateX(0)',
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(15, 15, 26, 0.45)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`shoppe-drawer shoppe-drawer-${position} ${className}`}
        style={{
          position: 'fixed',
          backgroundColor: 'var(--paper)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1101,
          animation: isBottom
            ? 'slideDown 250ms ease-out'
            : 'slideInRight 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          ...getDrawerStyles(),
          ...style,
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: 'var(--space-24)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {title ? (
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--fs-h3)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {title}
            </h3>
          ) : (
            <div />
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: 'var(--radius-xs)',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Drawer Content */}
        <div style={{ padding: 'var(--space-24)', overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

export default Drawer;
