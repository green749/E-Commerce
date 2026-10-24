import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AccountLayout } from '../components/account/AccountLayout.jsx';
import { Price, Button, Skeleton, Modal, Select, useToast } from '../components/ui/index.js';
import { ordersApi } from '../api/orders.js';

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [isCancelling, setIsCancelling] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItemId, setReturnItemId] = useState('');
  const [returnReason, setReturnReason] = useState('Defective / Sound distortion');
  const [isReturning, setIsReturning] = useState(false);

  // Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getOrderByNumber(orderNumber);
      setOrder(data);
      if (data.items?.length > 0) {
        setReturnItemId(data.items[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);


  // Status Color Logic
  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
        return '#2563eb';
      case 'packed':
        return '#4f46e5';
      case 'shipped':
        return '#9333ea';
      case 'delivered':
        return '#16a34a';
      case 'cancelled':
        return '#dc2626';
      case 'returned':
        return '#ea580c';
      case 'pending_payment':
      default:
        return '#d97706';
    }
  };

  // Timeline Step Calculations
  const timelineSteps = [
    { key: 'placed', label: 'Placed', icon: '📝' },
    { key: 'packed', label: 'Packed', icon: '📦' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const orderRanks = {
      pending_payment: 0,
      placed: 1,
      packed: 2,
      shipped: 3,
      delivered: 4,
    };
    const stepRank = orderRanks[stepKey] || 0;
    const currentRank = orderRanks[currentStatus] || 0;

    if (currentStatus === 'cancelled' || currentStatus === 'returned') {
      return 'inactive';
    }
    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'current';
    return 'upcoming';
  };

  // Cancel Handler
  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      await ordersApi.cancelOrder(orderNumber, cancelReason);
      toast.success('Order has been successfully cancelled and stock released.', 'Order Cancelled');
      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order', 'Cancel Failed');
    } finally {
      setIsCancelling(false);
    }
  };

  // Return Handler
  const handleRequestReturn = async () => {
    if (!returnItemId) {
      toast.error('Please select an item to return', 'Selection Required');
      return;
    }
    setIsReturning(true);
    try {
      await ordersApi.requestReturn(orderNumber, returnItemId, returnReason);
      toast.success('Return request submitted. Our logistics partner will schedule pickup.', 'Return Initiated');
      setIsReturnModalOpen(false);
      await fetchOrder();
    } catch (err) {
      toast.error(err.message || 'Failed to submit return request', 'Return Error');
    } finally {
      setIsReturning(false);
    }
  };

  // Printable Invoice Trigger
  const handlePrintInvoice = () => {
    window.print();
  };

  const isCancellable = order && ['pending_payment', 'placed', 'packed'].includes(order.status);
  const isReturnable = order && order.status === 'delivered';

  return (
    <AccountLayout
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Account', href: '/account' },
        { label: 'Orders', href: '/account/orders' },
        { label: orderNumber || 'Details' },
      ]}
    >
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
          <Skeleton height="40px" width="300px" />
          <Skeleton height="100px" />
          <Skeleton height="200px" />
        </div>
      )}

      {!isLoading && error && (
        <div style={{ padding: 'var(--space-32) 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
          <Link to="/account/orders" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">← Back to Orders</Button>
          </Link>
        </div>
      )}

      {!isLoading && order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-40)' }}>
          {/* Header Row: Title, Color-coded text Status Badge, Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 'var(--space-16)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: 'var(--space-24)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <h1 className="h2" style={{ margin: 0 }}>
                  {order.order_number}
                </h1>
                {/* Status badge in color-coded text (NOT boxed) */}
                <div
                  style={{
                    color: getStatusColor(order.status),
                    fontWeight: 800,
                    fontSize: '14px',
                    fontFamily: 'var(--font-heading)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(order.status),
                      display: 'inline-block',
                    }}
                  />
                  {order.status.toUpperCase()}
                </div>

                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  {order.payment_status}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px' }}>
                Placed on {new Date(order.created_at).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>

            {/* Action Buttons: Cancel, Return, Download Invoice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {isCancellable && (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ color: 'var(--danger)', border: '1px solid var(--border)' }}
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel Order
                </Button>
              )}

              {isReturnable && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReturnModalOpen(true)}
                >
                  Return Item
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(true)}
              >
                📄 Download Invoice
              </Button>
            </div>
          </div>

          {/* Visual Status Timeline (Placed, Packed, Shipped, Delivered) */}
          <div style={{ padding: 'var(--space-8) 0' }}>
            <h3 className="h4" style={{ marginBottom: 'var(--space-20)', fontSize: '16px' }}>
              Fulfillment Timeline
            </h3>

            {order.status === 'cancelled' ? (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  borderLeft: '4px solid #dc2626',
                  borderRadius: 'var(--radius-sm)',
                  color: '#dc2626',
                  fontSize: '14px',
                }}
              >
                <strong>Order Cancelled:</strong> This order has been cancelled and any reserved inventory has been returned to stock.
              </div>
            ) : order.status === 'returned' ? (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(234, 88, 12, 0.08)',
                  borderLeft: '4px solid #ea580c',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ea580c',
                  fontSize: '14px',
                }}
              >
                <strong>Order Returned:</strong> Return has been processed and refund is pending verification.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 'var(--space-16)',
                  position: 'relative',
                }}
              >
                {timelineSteps.map((step, idx) => {
                  const status = getStepStatus(step.key, order.status);
                  const isDone = status === 'completed';
                  const isCurrent = status === 'current';

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      {/* Connecting Line to next step */}
                      {idx < timelineSteps.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '18px',
                            left: '50%',
                            width: '100%',
                            height: '2px',
                            backgroundColor: isDone ? 'var(--primary)' : 'var(--border)',
                            zIndex: 1,
                            transition: 'background-color var(--transition-normal)',
                          }}
                        />
                      )}

                      {/* Step Indicator Circle */}
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: isDone || isCurrent ? 'var(--primary)' : 'var(--paper)',
                          border: `2px solid ${isDone || isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                          color: isDone || isCurrent ? '#ffffff' : 'var(--muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: 700,
                          position: 'relative',
                          zIndex: 2,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(79, 70, 229, 0.15)' : 'none',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {isDone ? '✓' : step.icon}
                      </div>

                      <div
                        style={{
                          marginTop: '10px',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '14px',
                          fontWeight: isCurrent ? 800 : isDone ? 600 : 500,
                          color: isCurrent ? 'var(--primary)' : isDone ? 'var(--ink)' : 'var(--muted)',
                        }}
                      >
                        {step.label}
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Items In This Order (No Cards - Open Editorial Rows) */}
          <div>
            <h3 className="h4" style={{ marginBottom: 'var(--space-16)', fontSize: '16px' }}>
              Purchased Hardware ({order.items?.length || 0})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {order.items?.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-16) 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderTop: idx === 0 ? '1px solid var(--border-subtle)' : 'none',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--paper-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      🎧
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)', fontFamily: 'var(--font-heading)' }}>
                        {item.product_name_snapshot || item.product_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        SKU: {item.sku} • Qty: {item.quantity}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-24)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <Price price={item.line_total || item.unit_price * item.quantity} isPaise size="md" />
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        (<Price price={item.unit_price} isPaise size="xs" /> each)
                      </div>
                    </div>

                    {isReturnable && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setReturnItemId(item.id);
                          setIsReturnModalOpen(true);
                        }}
                      >
                        Return
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Information (No Cards - Clean 2-column open layout) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-32)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 'var(--space-24)',
            }}
          >
            {/* Delivery Address */}
            <div>
              <h4 className="h4" style={{ fontSize: '15px', marginBottom: '12px' }}>
                Delivery Destination
              </h4>
              {order.address_snapshot ? (
                <div style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--slate)' }}>
                  <strong>{order.address_snapshot.full_name || order.address_snapshot.name}</strong>
                  <br />
                  {order.address_snapshot.address_line1 || order.address_snapshot.line1}
                  {order.address_snapshot.address_line2 && (
                    <>
                      <br />
                      {order.address_snapshot.address_line2}
                    </>
                  )}
                  <br />
                  {order.address_snapshot.city}, {order.address_snapshot.state} -{' '}
                  {order.address_snapshot.postal_code || order.address_snapshot.pincode}
                  <br />
                  Phone: {order.address_snapshot.phone}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>No address recorded</div>
              )}
            </div>

            {/* Payment Summary */}
            <div>
              <h4 className="h4" style={{ fontSize: '15px', marginBottom: '12px' }}>
                Payment Breakdown
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <Price price={order.subtotal} isPaise size="sm" />
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Coupon Discount</span>
                    <span>- <Price price={order.discount} isPaise size="sm" /></span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Express Shipping</span>
                  <span>{order.shipping_fee > 0 ? <Price price={order.shipping_fee} isPaise size="sm" /> : 'FREE'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Tax (GST 18%)</span>
                  <Price price={order.tax} isPaise size="sm" />
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontWeight: 800 }}>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>Total Amount</span>
                  <Price price={order.total} isPaise size="md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Order Confirmation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
              Keep Order
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleCancelOrder}
              isLoading={isCancelling}
            >
              Confirm Cancellation
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '1.5' }}>
            Are you sure you want to cancel order <strong>{orderNumber}</strong>? The reserved inventory will be immediately restocked.
          </p>
          <Select
            label="Reason for cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            options={[
              { value: 'Changed my mind', label: 'Changed my mind' },
              { value: 'Found better price elsewhere', label: 'Found better price elsewhere' },
              { value: 'Ordered incorrect variant/color', label: 'Ordered incorrect variant/color' },
              { value: 'Delivery estimated time too long', label: 'Delivery estimated time too long' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </div>
      </Modal>

      {/* Return Item Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Initiate Return Request"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsReturnModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handleRequestReturn} isLoading={isReturning}>
              Submit Return Request
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '1.5' }}>
            Products delivered within the last 7 days are eligible for hassle-free acoustic returns.
          </p>

          {order?.items && order.items.length > 1 && (
            <Select
              label="Select Item to Return"
              value={returnItemId}
              onChange={(e) => setReturnItemId(e.target.value)}
              options={order.items.map((i) => ({
                value: i.id,
                label: `${i.product_name_snapshot || i.product_name} (Qty: ${i.quantity})`,
              }))}
            />
          )}

          <Select
            label="Reason for Return"
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            options={[
              { value: 'Defective / Sound distortion', label: 'Defective / Sound distortion' },
              { value: 'Key switch wobble / Mechanical fault', label: 'Key switch wobble / Mechanical fault' },
              { value: 'Missing cables or accessories', label: 'Missing cables or accessories' },
              { value: 'Acoustic profile did not match expectation', label: 'Acoustic profile did not match expectation' },
              { value: 'Cosmetic damage in shipping transit', label: 'Cosmetic damage in shipping transit' },
            ]}
          />
        </div>
      </Modal>

      {/* Printable Invoice Modal & View */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={`Tax Invoice - ${order?.order_number}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsInvoiceModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrintInvoice}>
              🖨️ Print / Save as PDF
            </Button>
          </>
        }
      >
        {order && (
          <div id="printable-invoice" style={{ padding: '8px', color: '#111827', fontFamily: 'var(--font-body)' }}>
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  SHOPPE HARDWARE
                </h2>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  High-Fidelity Audio & Precision Mechanicals
                  <br />
                  CIN: U52100KA2026PTC109823 • GSTIN: 29AABCU9603R1ZM
                  <br />
                  80 Feet Road, Indiranagar, Bengaluru, KA 560038
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>TAX INVOICE</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Invoice: INV-{order.order_number.replace('ORD-', '')}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Date: {new Date(order.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
              </div>
            </div>

            {/* Billed To */}
            <div style={{ marginBottom: '24px', fontSize: '13px', lineHeight: '20px' }}>
              <strong style={{ textTransform: 'uppercase', fontSize: '11px', color: '#6b7280' }}>Billed & Shipped To:</strong>
              <div><strong>{order.address_snapshot?.full_name || order.address_snapshot?.name || 'Customer'}</strong></div>
              <div>{order.address_snapshot?.address_line1 || order.address_snapshot?.line1}</div>
              {order.address_snapshot?.address_line2 && <div>{order.address_snapshot?.address_line2}</div>}
              <div>
                {order.address_snapshot?.city}, {order.address_snapshot?.state} - {order.address_snapshot?.postal_code || order.address_snapshot?.pincode}
              </div>
              <div>Phone: {order.address_snapshot?.phone}</div>
            </div>

            {/* Invoice Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #111827', textAlign: 'left' }}>
                  <th style={{ padding: '8px 0' }}>Item Description</th>
                  <th style={{ padding: '8px 0' }}>SKU</th>
                  <th style={{ padding: '8px 0', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 0', fontWeight: 600 }}>{item.product_name_snapshot || item.product_name}</td>
                    <td style={{ padding: '10px 0', color: '#6b7280', fontSize: '12px' }}>{item.sku}</td>
                    <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}><Price price={item.unit_price} isPaise size="xs" /></td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>
                      <Price price={item.line_total || item.unit_price * item.quantity} isPaise size="xs" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Subtotal:</span>
                  <Price price={order.subtotal} isPaise size="xs" />
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount:</span>
                    <span>- <Price price={order.discount} isPaise size="xs" /></span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Shipping:</span>
                  <span>{order.shipping_fee > 0 ? <Price price={order.shipping_fee} isPaise size="xs" /> : 'FREE'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>GST (18% IGST/CGST):</span>
                  <Price price={order.tax} isPaise size="xs" />
                </div>
                <div style={{ borderTop: '1.5px solid #111827', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '15px' }}>
                  <span>Total Amount Paid:</span>
                  <Price price={order.total} isPaise size="sm" />
                </div>
              </div>
            </div>

            {/* Footer Stamp */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
              Computer generated invoice. No signature required. Covered by Shoppe 1-Year Limited Audiophile Warranty.
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </AccountLayout>
  );
}

export default OrderDetailPage;
