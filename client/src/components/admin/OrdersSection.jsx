import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Input, Button, Modal, Select, Price, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { ordersApi } from '../../api/orders.js';
import { AdminTable } from './AdminTable.jsx';

export function OrdersSection() {
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Order Details Modal
  const [viewingOrderNumber, setViewingOrderNumber] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Transition in progress
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getOrders({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      let items = res.items || [];

      // Date filtering on client side if requested
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        items = items.filter((o) => o.created_at.startsWith(todayStr));
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        items = items.filter((o) => new Date(o.created_at) >= weekAgo);
      }

      setOrders(items);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, dateFilter, page, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetails = async (orderNumber) => {
    setViewingOrderNumber(orderNumber);
    setIsLoadingDetails(true);
    try {
      const data = await ordersApi.getOrderByNumber(orderNumber);
      setOrderDetails(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load order details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleStatusTransition = async (order, nextStatus) => {
    setUpdatingOrderId(order.id);
    try {
      await adminApi.updateOrderStatus(order.id, {
        status: nextStatus,
        note: `Status updated to ${nextStatus} by Admin`,
      });
      toast.success(
        `Order ${order.order_number} transitioned to ${nextStatus.toUpperCase()}`,
        'Status Updated'
      );
      await fetchOrders();
      if (viewingOrderNumber === order.order_number) {
        handleOpenDetails(order.order_number);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to transition order status', 'Transition Error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadgeConfig = (status) => {
    switch (status) {
      case 'placed':
        return { bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6', label: 'PLACED' };
      case 'packed':
        return { bg: '#f5f3ff', color: '#5b21b6', dot: '#8b5cf6', label: 'PACKED' };
      case 'shipped':
        return { bg: '#faf5ff', color: '#6b21a8', dot: '#a855f7', label: 'SHIPPED' };
      case 'delivered':
        return { bg: '#eaf4ee', color: '#166534', dot: '#16a34a', label: 'DELIVERED' };
      case 'cancelled':
        return { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'CANCELLED' };
      case 'returned':
        return { bg: '#fff7ed', color: '#9a3412', dot: '#ea580c', label: 'RETURNED' };
      case 'pending_payment':
      default:
        return { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', label: 'PENDING' };
    }
  };

  const columns = [
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
      header: 'Date',
      key: 'created_at',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#5e6b5f' }}>
          {new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Items',
      key: 'items_count',
      align: 'center',
      render: (row) => <span style={{ fontWeight: 600, color: '#1e382b' }}>{row.items_count || 1}</span>,
    },
    {
      header: 'Total',
      key: 'total',
      align: 'right',
      render: (row) => <Price price={row.total} isPaise size="xs" />,
    },
    {
      header: 'Payment',
      key: 'payment_status',
      render: (row) => {
        const isPaid = row.payment_status === 'paid';
        return (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: isPaid ? '#eaf4ee' : '#fffbeb',
              color: isPaid ? '#166534' : '#92400e',
            }}
          >
            {row.payment_status?.toUpperCase() || 'UNPAID'}
          </span>
        );
      },
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
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => {
        const isBusy = updatingOrderId === row.id;

        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center' }}>
            {row.status === 'placed' && (
              <Button
                size="xs"
                variant="primary"
                disabled={isBusy}
                onClick={() => handleStatusTransition(row, 'packed')}
              >
                Pack
              </Button>
            )}

            {row.status === 'packed' && (
              <Button
                size="xs"
                variant="primary"
                disabled={isBusy}
                onClick={() => handleStatusTransition(row, 'shipped')}
              >
                Ship
              </Button>
            )}

            {row.status === 'shipped' && (
              <Button
                size="xs"
                variant="primary"
                style={{ backgroundColor: '#1e382b', borderColor: '#1e382b' }}
                disabled={isBusy}
                onClick={() => handleStatusTransition(row, 'delivered')}
              >
                Deliver
              </Button>
            )}

            <button
              type="button"
              onClick={() => handleOpenDetails(row.order_number)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '6px',
                border: '1px solid #d4cdc3',
                backgroundColor: '#ffffff',
                color: '#1e382b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f7f4ef';
                e.currentTarget.style.borderColor = '#1e382b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#d4cdc3';
              }}
            >
              Details
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', maxWidth: '380px' }}>
            <Input
              placeholder="Search by order #, customer, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch size={14} style={{ color: '#889387' }} />}
            />
          </div>

          <div style={{ width: '150px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'placed', label: 'Placed' },
                { value: 'packed', label: 'Packed' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          <div style={{ width: '130px' }}>
            <Select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Placed Today' },
                { value: 'week', label: 'Last 7 Days' },
              ]}
            />
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#687367' }}>
          Total: <strong style={{ color: '#1e382b' }}>{totalItems}</strong> orders
        </div>
      </div>

      {/* Data Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={orders}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No orders found matching the filter criteria."
      />

      {/* Order Detail View Modal */}
      <Modal
        isOpen={!!viewingOrderNumber}
        onClose={() => setViewingOrderNumber(null)}
        title={`Order Details - ${viewingOrderNumber}`}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setViewingOrderNumber(null)}>
            Close
          </Button>
        }
      >
        {isLoadingDetails || !orderDetails ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading order details...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px' }}>
            {/* Status & Transition Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'var(--paper-subtle)',
                borderRadius: 'var(--radius-sm)',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                Status:{' '}
                <strong style={{ color: getStatusBadgeConfig(orderDetails.status).color }}>
                  {orderDetails.status.toUpperCase()}
                </strong>{' '}
                | Payment: <strong>{orderDetails.payment_status?.toUpperCase()}</strong>
              </div>

              {/* Move to next stage button */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {orderDetails.status === 'placed' && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => handleStatusTransition(orderDetails, 'packed')}
                  >
                    Move to Packed
                  </Button>
                )}
                {orderDetails.status === 'packed' && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => handleStatusTransition(orderDetails, 'shipped')}
                  >
                    Move to Shipped
                  </Button>
                )}
                {orderDetails.status === 'shipped' && (
                  <Button
                    size="xs"
                    variant="primary"
                    style={{ backgroundColor: '#1e382b', borderColor: '#1e382b' }}
                    onClick={() => handleStatusTransition(orderDetails, 'delivered')}
                  >
                    Move to Delivered
                  </Button>
                )}
              </div>
            </div>

            {/* Delivery Address & Customer Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)' }}>
                  Shipping Destination:
                </strong>
                <div style={{ marginTop: '4px', lineHeight: '20px' }}>
                  <strong>{orderDetails.address_snapshot?.full_name || orderDetails.address_snapshot?.name}</strong>
                  <br />
                  {orderDetails.address_snapshot?.address_line1 || orderDetails.address_snapshot?.line1}
                  {orderDetails.address_snapshot?.address_line2 && (
                    <>, {orderDetails.address_snapshot.address_line2}</>
                  )}
                  <br />
                  {orderDetails.address_snapshot?.city}, {orderDetails.address_snapshot?.state} -{' '}
                  {orderDetails.address_snapshot?.postal_code || orderDetails.address_snapshot?.pincode}
                  <br />
                  Phone: {orderDetails.address_snapshot?.phone}
                </div>
              </div>

              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)' }}>
                  Financial Breakdown:
                </strong>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <Price price={orderDetails.subtotal} isPaise size="xs" />
                  </div>
                  {orderDetails.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                      <span>Discount:</span>
                      <span>- <Price price={orderDetails.discount} isPaise size="xs" /></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax (GST 18%):</span>
                    <Price price={orderDetails.tax} isPaise size="xs" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                    <span>Total Paid:</span>
                    <Price price={orderDetails.total} isPaise size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Purchased Items ({orderDetails.items?.length || 0}):
              </strong>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {orderDetails.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: idx < orderDetails.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.product_name_snapshot || item.product_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>SKU: {item.sku} • Qty: {item.quantity}</div>
                    </div>
                    <div>
                      <Price price={item.line_total || item.unit_price * item.quantity} isPaise size="xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Timeline History */}
            {orderDetails.timeline && orderDetails.timeline.length > 0 && (
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  Audit Trail & Status Transitions:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {orderDetails.timeline.map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--paper-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong>{entry.to_status.toUpperCase()}</strong>: {entry.note || 'No note'}
                      </span>
                      <span style={{ color: 'var(--muted)' }}>
                        {new Date(entry.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OrdersSection;
