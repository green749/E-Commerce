import React from 'react';
import { Button, Skeleton } from '../ui/index.js';

export function AdminTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  page = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  rowKey = 'id',
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Simple, Neat, Medium-Size Table Container */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          border: '1px solid #e7e3db',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px',
          }}
        >
          {/* Neat Table Header */}
          <thead>
            <tr style={{ backgroundColor: '#f8f6f2', borderBottom: '1.5px solid #ded6c9' }}>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{
                    padding: '11px 16px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#5e6b5f',
                    textAlign: col.align || 'left',
                    width: col.width || 'auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Medium-Size Neat Table Body */}
          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} style={{ borderBottom: '1px solid #f0ede6' }}>
                  {columns.map((col, cIdx) => (
                    <td key={`skel-c-${cIdx}`} style={{ padding: '12px 16px' }}>
                      <Skeleton height="14px" width="75%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State Row
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#889387',
                    fontSize: '13px',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Clean Data Rows with Hover
              data.map((row, rIdx) => (
                <tr
                  key={row[rowKey] || rIdx}
                  style={{
                    borderBottom: '1px solid #f0ede6',
                    backgroundColor: '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#faf8f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={`td-${cIdx}`}
                      style={{
                        padding: '12px 16px',
                        color: '#1e382b',
                        verticalAlign: 'middle',
                        textAlign: col.align || 'left',
                      }}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Neat Medium Pagination Bar */}
      {totalPages > 1 && onPageChange && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 4px 0',
            fontSize: '12px',
            color: '#687367',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong>
            {totalItems > 0 && <span> ({totalItems} total records)</span>}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              size="xs"
              variant="secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid #ded6c9',
                backgroundColor: '#ffffff',
              }}
            >
              ← Previous
            </Button>
            <Button
              size="xs"
              variant="secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid #ded6c9',
                backgroundColor: '#ffffff',
              }}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTable;
