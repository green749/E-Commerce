import React from 'react';
import { Skeleton } from '../ui/index.js';

export function ProductTileSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--paper)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Square image placeholder */}
      <div style={{ width: '100%', aspectRatio: '1 / 1' }}>
        <Skeleton variant="rect" width="100%" height="100%" />
      </div>

      {/* Content lines */}
      <div
        style={{
          padding: 'var(--space-16)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-8)',
        }}
      >
        <Skeleton width="40%" height="12px" />
        <Skeleton width="90%" height="18px" />
        <Skeleton width="70%" height="18px" />
        <div style={{ margin: '4px 0' }}>
          <Skeleton width="50%" height="14px" />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: 'auto' }}>
          <Skeleton width="45%" height="22px" />
          <Skeleton width="30%" height="18px" />
        </div>
      </div>
    </div>
  );
}

export default ProductTileSkeleton;
