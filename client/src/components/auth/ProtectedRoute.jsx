import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Skeleton } from '../ui/Skeleton.jsx';

/**
 * Route wrapper that restricts access to authenticated users
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 'var(--space-64) var(--space-24)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <Skeleton height="32px" width="240px" />
          <Skeleton height="18px" width="400px" />
          <Skeleton height="120px" width="100%" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
