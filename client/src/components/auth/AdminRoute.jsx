import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { EmptyState } from '../ui/EmptyState.jsx';

/**
 * Route wrapper that restricts access strictly to users with role === 'admin'
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: 'var(--space-64) var(--space-24)' }}>
        <p style={{ color: 'var(--muted)' }}>Verifying administrative permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container section">
        <EmptyState
          title="Access Restricted"
          description="You do not have administrative privileges to access this operational dashboard."
          actionText="Return to Shop"
          actionHref="/"
        />
      </div>
    );
  }

  return children;
}

export default AdminRoute;
