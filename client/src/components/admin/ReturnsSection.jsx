import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Modal, Select, Price, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { AdminTable } from './AdminTable.jsx';

export function ReturnsSection() {
  const toast = useToast();

  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Handle Return Modal
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [action, setAction] = useState('approve');
  const [refundRupees, setRefundRupees] = useState('');
  const [reviewReason, setReviewReason] = useState('Return approved; acoustic condition inspected');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getReturns({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setReturns(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const openActionModal = (ret) => {
    setSelectedReturn(ret);
    setAction('approve');
    const defaultRefund = ret.refund_amount > 0 ? ret.refund_amount : ret.line_total || ret.unit_price;
    setRefundRupees((defaultRefund / 100).toString());
    setReviewReason('Return approved; hardware received and inspected');
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (action === 'approve' && (refundRupees === '' || Number(refundRupees) < 0)) {
      toast.error('Valid refund amount is required for approval', 'Validation Error');
      return;
    }

    setIsProcessing(true);
    try {
      await adminApi.handleReturn(selectedReturn.id, {
        action,
        refund_amount: action === 'approve' ? Math.round(Number(refundRupees) * 100) : 0,
        reason: reviewReason.trim(),
      });
      toast.success(
        `Return request ${action === 'approve' ? 'Approved' : 'Rejected'} successfully.`,
        'Return Processed'
      );
      setSelectedReturn(null);
      await fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Failed to process return', 'Action Error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeConfig = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6', label: 'APPROVED' };
      case 'refunded':
        return { bg: '#eaf4ee', color: '#166534', dot: '#16a34a', label: 'REFUNDED' };
      case 'rejected':
        return { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'REJECTED' };
      case 'requested':
      default:
        return { bg: '#fff7ed', color: '#9a3412', dot: '#ea580c', label: 'REQUESTED' };
    }
  };

  const columns = [
    {
      header: 'Return ID',
      key: 'id',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#687367' }}>
          {row.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Order #',
      key: 'order_number',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#1e382b' }}>
          {row.order_number}
        </span>
      ),
    },
    {
      header: 'Customer',
      key: 'customer_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e382b' }}>{row.customer_name || 'Customer'}</div>
          <div style={{ fontSize: '11px', color: '#687367' }}>{row.customer_email}</div>
        </div>
      ),
    },
    {
      header: 'Item Snapshot',
      key: 'product_name_snapshot',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e382b' }}>{row.product_name_snapshot}</div>
          <div style={{ fontSize: '11px', color: '#687367', fontFamily: 'monospace' }}>
            SKU: {row.sku} • Qty: {row.item_quantity || 1}
          </div>
        </div>
      ),
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#5e6b5f' }}>{row.reason}</span>
      ),
    },
    {
      header: 'Refund Amount',
      key: 'refund_amount',
      align: 'right',
      render: (row) => (
        <Price
          price={row.refund_amount > 0 ? row.refund_amount : row.line_total || row.unit_price}
          isPaise
          size="xs"
        />
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        const conf = getStatusBadgeConfig(row.status);
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: conf.bg,
              color: conf.color,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: conf.dot,
              }}
            />
            {conf.label}
          </span>
        );
      },
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div>
          {row.status === 'requested' ? (
            <button
              type="button"
              onClick={() => openActionModal(row)}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #1e382b',
                backgroundColor: '#1e382b',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Review Ticket
            </button>
          ) : (
            <span style={{ fontSize: '12px', color: '#889387' }}>Settled</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Streamlined Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ width: '200px' }}>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Returns' },
              { value: 'requested', label: 'Requested (Pending)' },
              { value: 'approved', label: 'Approved' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#687367' }}>
          Total: <strong style={{ color: '#1e382b' }}>{totalItems}</strong> return tickets
        </div>
      </div>

      {/* Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={returns}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No return tickets found."
      />

      {/* Approve / Reject Modal */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={`Process Return - Order ${selectedReturn?.order_number}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedReturn(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={action === 'reject' ? { backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
              onClick={handleProcessReturn}
              isLoading={isProcessing}
            >
              {action === 'approve' ? 'Approve & Issue Refund' : 'Reject Return'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleProcessReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--paper-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <div>
              Item: <strong>{selectedReturn?.product_name_snapshot}</strong> ({selectedReturn?.sku})
            </div>
            <div>
              Customer Reason: <em>"{selectedReturn?.reason}"</em>
            </div>
          </div>

          <Select
            label="Decision Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { value: 'approve', label: 'Approve Return & Authorize Refund' },
              { value: 'reject', label: 'Reject Return (Item damaged by user / Exceeded 7 days)' },
            ]}
          />

          {action === 'approve' && (
            <Input
              label="Refund Amount (₹)"
              type="number"
              value={refundRupees}
              onChange={(e) => setRefundRupees(e.target.value)}
              helperText="Full price or partial restocking deduction"
              required
            />
          )}

          <Input
            label="Internal Audit Review Reason"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export default ReturnsSection;
