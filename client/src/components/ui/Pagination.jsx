import React from 'react';

/**
 * Reusable Pagination component with page numbers, ellipsis, and prev/next controls
 */
export function Pagination({ page = 1, totalPages = 1, onPageChange, className = '', style = {} }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 1; // Number of pages around current page

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const buttonBaseStyle = {
    minWidth: '38px',
    height: '38px',
    padding: '0 8px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    backgroundColor: 'var(--paper)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--fs-small)',
    fontWeight: 'var(--fw-semibold)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
    userSelect: 'none',
  };

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`pagination-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-8)',
        marginTop: 'var(--space-32)',
        ...style,
      }}
    >
      {/* Previous Button */}
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        aria-label="Previous Page"
        style={{
          ...buttonBaseStyle,
          cursor: page <= 1 ? 'not-allowed' : 'pointer',
          opacity: page <= 1 ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (page > 1) e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              style={{
                width: '32px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--fs-small)',
              }}
            >
              ...
            </span>
          );
        }

        const isActive = p === page;

        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange?.(p)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              ...buttonBaseStyle,
              backgroundColor: isActive ? 'var(--primary)' : 'var(--paper)',
              color: isActive ? '#ffffff' : 'var(--ink)',
              borderColor: isActive ? 'var(--primary)' : 'var(--border)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {p}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange?.(page + 1)}
        aria-label="Next Page"
        style={{
          ...buttonBaseStyle,
          cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          opacity: page >= totalPages ? 0.4 : 1,
        }}
        onMouseEnter={(e) => {
          if (page < totalPages) e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </nav>
  );
}

export default Pagination;
