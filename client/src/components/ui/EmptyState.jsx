import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button.jsx';

/**
 * EmptyState component for empty cart, zero search results, no orders, etc.
 */
export function EmptyState({
  icon,
  title = 'No items found',
  description = 'There is nothing to display here right now.',
  actionText,
  onAction,
  actionHref,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`empty-state-container ${className}`}
      style={{
        padding: 'var(--space-64) var(--space-24)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        margin: '0 auto',
        maxWidth: '480px',
        ...style,
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--soft)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-24)',
          border: '1px solid var(--primary-light)',
        }}
      >
        {icon || (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        )}
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--fs-h3)',
          fontWeight: 'var(--fw-bold)',
          color: 'var(--ink)',
          marginBottom: 'var(--space-8)',
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 'var(--fs-body)',
          color: 'var(--muted)',
          lineHeight: 'var(--lh-body)',
          marginBottom: actionText ? 'var(--space-24)' : 0,
        }}
      >
        {description}
      </p>

      {actionText && (
        <div>
          {actionHref ? (
            <Link to={actionHref} style={{ textDecoration: 'none' }}>
              <Button variant="primary">{actionText}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
