import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout.jsx';
import { Input, Price, Button, Skeleton } from '../components/ui/index.js';
import { ordersApi } from '../api/orders.js';

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await ordersApi.getMyOrders();
        if (isMounted) {
          setOrders(res.items || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order history');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = orders.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      ord.order_number?.toLowerCase().includes(q) ||
      ord.items?.some((item) => item.product_name?.toLowerCase().includes(q))
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return '#2563eb'; // Blue
      case 'packed':
        return '#4f46e5'; // Indigo
      case 'shipped':
        return '#9333ea'; // Purple
      case 'delivered':
        return '#16a34a'; // Emerald
      case 'cancelled':
        return '#dc2626'; // Red
      case 'returned':
        return '#ea580c'; // Orange
      case 'pending_payment':
      default:
        return '#d97706'; // Amber
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'placed':
        return 'Order Placed';
      case 'packed':
        return 'Packed';
      case 'shipped':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status ? status.toUpperCase() : 'UNKNOWN';
    }
  };

  return (
    <AccountLayout
      title="Order History"
      subtitle="Track your shipments, view purchase records, and download VAT invoices."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Account', href: '/account' },
        { label: 'Orders' },
      ]}
    >
      <div>
        {/* Search Bar (No Cards) */}
        <div style={{ maxWidth: '440px', marginBottom: 'var(--space-32)' }}>
          <Input
            placeholder="Search by order number or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<span style={{ fontSize: '15px' }}>🔍</span>}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            <Skeleton height="80px" borderRadius="var(--radius-sm)" />
            <Skeleton height="80px" borderRadius="var(--radius-sm)" />
            <Skeleton height="80px" borderRadius="var(--radius-sm)" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div
            style={{
              padding: '16px',
              color: 'var(--danger)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div
            style={{
              padding: 'var(--space-48) 0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📦</div>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '8px' }}>
              {searchQuery ? 'No matching orders found' : 'No orders placed yet'}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 24px' }}>
              {searchQuery
                ? `No orders matching "${searchQuery}". Please check your order number.`
                : 'When you place orders for audiophile headphones, custom keyboards, or studio gear, they will appear here.'}
            </p>
            <Link to="/shop" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Explore Store Catalog</Button>
            </Link>
          </div>
        )}

        {/* Order List: Open layout, NO CARDS, color-coded text badges */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredOrders.map((ord, idx) => {
              const statusColor = getStatusColor(ord.status);
              const itemsCount = ord.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || ord.items?.length || 0;
              const itemsSummary =
                ord.items && ord.items.length > 0
                  ? ord.items.map((i) => i.product_name).join(', ')
                  : 'Hardware purchase';

              return (
                <div
                  key={ord.id || ord.order_number}
                  style={{
                    padding: 'var(--space-24) 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderTop: idx === 0 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Top Bar: Order Number, Date, Status (Color-coded text, NOT boxed) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: 'var(--ink)',
                        }}
                      >
                        {ord.order_number}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                        Placed {new Date(ord.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Status Badge in Color-Coded Text (Not Boxed) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          color: statusColor,
                          fontWeight: 700,
                          fontSize: '13px',
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '0.02em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: statusColor,
                            display: 'inline-block',
                          }}
                        />
                        {formatStatus(ord.status)}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: ord.payment_status === 'paid' ? 'var(--success)' : 'var(--muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {ord.payment_status}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Items summary & Total */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ maxWidth: '600px' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          color: 'var(--slate)',
                          lineHeight: '1.4',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {itemsSummary}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        {itemsCount} item{itemsCount === 1 ? '' : 's'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-20)' }}>
                      <Price price={ord.total} isPaise size="md" />

                      <Link
                        to={`/account/orders/${ord.order_number}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button size="sm" variant="ghost" style={{ padding: '6px 12px' }}>
                          Details →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

export default OrdersPage;
