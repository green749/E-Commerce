import React from 'react';

/**
 * Skeleton component with linear gradient shimmer effect
 */
export function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  borderRadius,
  className = '',
  style = {},
}) {
  const getDefaultHeight = () => {
    switch (variant) {
      case 'circle':
        return typeof width === 'number' ? `${width}px` : width;
      case 'rect':
        return height || '180px';
      case 'text':
      default:
        return height || '16px';
    }
  };

  const getBorderRadius = () => {
    if (borderRadius) return typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
    switch (variant) {
      case 'circle':
        return '50%';
      case 'rect':
        return 'var(--radius-md)';
      case 'text':
      default:
        return 'var(--radius-xs)';
    }
  };

  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: getDefaultHeight(),
        borderRadius: getBorderRadius(),
        background: 'linear-gradient(90deg, #f0f0f4 25%, #e6e6ee 50%, #f0f0f4 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        display: 'inline-block',
        ...style,
      }}
    />
  );
}

export default Skeleton;
