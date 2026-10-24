import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Breadcrumbs navigation component
 * @param {Object} props
 * @param {Array<{ label: string, href?: string }>} props.items
 */
export function Breadcrumbs({ items = [], className = '', style = {} }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`breadcrumbs-nav ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-8)',
        fontSize: 'var(--fs-small)',
        fontFamily: 'var(--font-body)',
        color: 'var(--muted)',
        ...style,
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.label + index}>
            {index > 0 && (
              <span
                style={{
                  color: 'var(--muted-light)',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            )}

            {isLast || !item.href ? (
              <span
                aria-current={isLast ? 'page' : undefined}
                style={{
                  fontWeight: isLast ? 'var(--fw-semibold)' : 'var(--fw-regular)',
                  color: isLast ? 'var(--ink)' : 'var(--muted)',
                }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                style={{
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
