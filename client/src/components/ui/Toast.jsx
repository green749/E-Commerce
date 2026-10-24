import React, { useState, useCallback } from 'react';
import { ToastContext } from './useToast.js';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, title, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast = { id, type, message, title };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message, title = 'Success') => addToast({ type: 'success', message, title }),
    error: (message, title = 'Error') => addToast({ type: 'error', message, title }),
    warning: (message, title = 'Attention') => addToast({ type: 'warning', message, title }),
    info: (message, title = 'Notice') => addToast({ type: 'info', message, title }),
    remove: removeToast,
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          borderLeft: '4px solid var(--success)',
          iconColor: 'var(--success)',
        };
      case 'error':
        return {
          borderLeft: '4px solid var(--danger)',
          iconColor: 'var(--danger)',
        };
      case 'warning':
        return {
          borderLeft: '4px solid var(--warning)',
          iconColor: 'var(--warning)',
        };
      case 'info':
      default:
        return {
          borderLeft: '4px solid var(--primary)',
          iconColor: 'var(--primary)',
        };
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Fixed Container */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--space-24)',
          right: 'var(--space-24)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-8)',
          maxWidth: '380px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const typeStyle = getTypeStyles(t.type);
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'var(--paper)',
                boxShadow: 'var(--shadow-dropdown)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                borderLeft: typeStyle.borderLeft,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-16)',
                animation: 'toastSlideIn 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div style={{ flex: 1 }}>
                {t.title && (
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 'var(--fw-bold)',
                      fontSize: 'var(--fs-small)',
                      color: 'var(--ink)',
                      marginBottom: '2px',
                    }}
                  >
                    {t.title}
                  </div>
                )}
                <div
                  style={{ fontSize: 'var(--fs-small)', color: 'var(--muted)', lineHeight: '20px' }}
                >
                  {t.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted-light)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  width="14"
                  height="14"
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
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
