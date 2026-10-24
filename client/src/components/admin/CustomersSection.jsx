import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Input, Button, Modal, Price, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { AdminTable } from './AdminTable.jsx';

export function CustomersSection() {
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Customer Detail Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCustomers({
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setCustomers(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleViewCustomer = async (id) => {
    setSelectedCustomerId(id);
    setIsLoadingCustomer(true);
    try {
      const data = await adminApi.getCustomerById(id);
      setCustomerDetails(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load customer profile');
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const columns = [
    {
      header: 'Customer',
      key: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#f3efe9',
              border: '1px solid #ded6c9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              color: '#1e382b',
              flexShrink: 0,
            }}
          >
            {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#1e382b' }}>{row.name}</div>
            <div style={{ fontSize: '11px', color: '#687367' }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => <span style={{ color: '#5e6b5f', fontSize: '12px' }}>{row.phone || 'Not provided'}</span>,
    },
    {
      header: 'Orders',
      key: 'orders_count',
      align: 'center',
      render: (row) => <span style={{ fontWeight: 600, color: '#1e382b' }}>{row.orders_count || 0}</span>,
    },
    {
      header: 'Total Spent',
      key: 'total_spent',
      align: 'right',
      render: (row) => <Price price={row.total_spent || 0} isPaise size="xs" />,
    },
    {
      header: 'Joined Date',
      key: 'created_at',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#5e6b5f' }}>
          {new Date(row.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleViewCustomer(row.id)}
          style={{
            padding: '5px 12px',
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
          View Orders
        </button>
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
        <div style={{ maxWidth: '380px', flex: 1, minWidth: '240px' }}>
          <Input
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<FiSearch size={14} style={{ color: '#889387' }} />}
          />
        </div>

        <div style={{ fontSize: '13px', color: '#687367' }}>
          Total: <strong style={{ color: '#1e382b' }}>{totalItems}</strong> customers
        </div>
      </div>

      {/* Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No customers found."
      />

      {/* View Customer Details & Orders Modal */}
      <Modal
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        title={`Customer: ${customerDetails?.name || 'Loading...'}`}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setSelectedCustomerId(null)}>
            Close
          </Button>
        }
      >
        {isLoadingCustomer || !customerDetails ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>Loading customer records...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '13px' }}>
            {/* Customer Summary Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--paper-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Email</span>
                <div style={{ fontWeight: 600 }}>{customerDetails.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Phone</span>
                <div style={{ fontWeight: 600 }}>{customerDetails.phone || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Total Orders</span>
                <div style={{ fontWeight: 800, fontSize: '15px' }}>{customerDetails.orders_count || customerDetails.orders?.length || 0}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Lifetime Spend</span>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>
                  <Price price={customerDetails.total_spent || 0} isPaise size="xs" />
                </div>
              </div>
            </div>

            {/* Customer Saved Addresses */}
            {customerDetails.addresses && customerDetails.addresses.length > 0 && (
              <div>
                <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                  Saved Delivery Addresses ({customerDetails.addresses.length}):
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {customerDetails.addresses.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        lineHeight: '18px',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {a.full_name} {a.is_default && <span style={{ color: 'var(--primary)', fontSize: '10px' }}>(DEFAULT)</span>}
                      </div>
                      <div style={{ color: 'var(--slate)' }}>
                        {a.line1}, {a.city}, {a.state} - {a.pincode}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Orders History */}
            <div>
              <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Order History:
              </strong>
              {customerDetails.orders && customerDetails.orders.length > 0 ? (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Order #</th>
                        <th style={{ padding: '8px 12px' }}>Date</th>
                        <th style={{ padding: '8px 12px' }}>Items</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetails.orders.map((ord) => (
                        <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{ord.order_number}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--slate)' }}>
                            {new Date(ord.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '8px 12px' }}>{ord.items_count || 1}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <Price price={ord.total} isPaise size="xs" />
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {ord.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)' }}>
                  This customer has not placed any orders yet.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CustomersSection;
