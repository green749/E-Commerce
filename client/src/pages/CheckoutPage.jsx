import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumbs,
  Price,
  Button,
  Input,
  Checkbox,
  EmptyState,
  useToast,
} from '../components/ui/index.js';
import { useCartStore } from '../store/cartStore.js';
import { userApi } from '../api/user.js';
import { checkoutApi } from '../api/checkout.js';
import { eventsApi } from '../api/events.js';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    items,
    subtotal,
    discount,
    free_shipping_threshold,
    coupon,
    fetchCart,
    clearCart,
  } = useCartStore();

  // Active step: 1 = Address, 2 = Delivery, 3 = Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false,
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  // Delivery options state ('standard' | 'express')
  const [shippingOption, setShippingOption] = useState('standard');

  // Checkout and payment states
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [reservationNotice, setReservationNotice] = useState(null);

  // Fetch cart & track begin_checkout on mount
  useEffect(() => {
    fetchCart();
    eventsApi.track('begin_checkout', {
      page: '/checkout',
      step: 1,
    });
  }, [fetchCart]);

  // Fetch saved user addresses
  const {
    data: addresses = [],
    isLoading: isAddressesLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
    staleTime: 1000 * 60 * 5,
  });

  // Select default or first address on load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  // Shipping calculation based on selected option
  const shippingFee = useMemo(() => {
    if (shippingOption === 'express') {
      return 19900; // ₹199 express air
    }
    // Standard: free if subtotal >= 99900 paise, else ₹99
    return subtotal >= free_shipping_threshold ? 0 : 9900;
  }, [shippingOption, subtotal, free_shipping_threshold]);

  const tax = useMemo(() => {
    const taxable = Math.max(0, subtotal - discount + shippingFee);
    return Math.round(taxable * 0.18);
  }, [subtotal, discount, shippingFee]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + shippingFee + tax);
  }, [subtotal, discount, shippingFee, tax]);

  // Address form validation
  const validateAddressForm = () => {
    const errs = {};
    if (!addressForm.full_name.trim()) errs.full_name = 'Full name is required';
    if (!addressForm.phone.trim() || addressForm.phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Valid 10-digit mobile number required';
    }
    if (!addressForm.line1.trim()) errs.line1 = 'Street address is required';
    if (!addressForm.city.trim()) errs.city = 'City is required';
    if (!addressForm.state.trim()) errs.state = 'State is required';
    // Indian 6-digit pincode validation
    const pincodeClean = addressForm.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(pincodeClean)) {
      errs.pincode = 'Enter a valid 6-digit postal code (e.g. 560001)';
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit new address
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    try {
      setAddressSubmitting(true);
      const newAddr = await userApi.createAddress({
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim() || null,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        is_default: addressForm.is_default,
      });

      await refetchAddresses();
      setSelectedAddressId(newAddr.id);
      setShowAddAddressForm(false);
      showToast('Delivery address saved successfully!', 'success');
      setAddressForm({
        full_name: '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
      });
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setAddressSubmitting(false);
    }
  };

  // Generate idempotency key per checkout attempt
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  // Initiate Razorpay Checkout
  const handleInitiatePayment = async () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address', 'warning');
      setCurrentStep(1);
      return;
    }

    try {
      setIsProcessingPayment(true);
      setPaymentError(null);

      // Start checkout on backend (locks inventory with SELECT FOR UPDATE, creates 15-min reservation & Razorpay order)
      const checkoutRes = await checkoutApi.startCheckout({
        addressId: selectedAddressId,
        shippingOption,
        idempotencyKey: idempotencyKeyRef.current,
      });

      const { order, razorpay } = checkoutRes;

      setReservationNotice(
        `Inventory reserved for Order #${order.order_number}. Please complete payment within 15 minutes.`
      );

      // Open Razorpay Standard Checkout in Test Mode
      const razorpayKey =
        razorpay?.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag';

      if (!window.Razorpay) {
        throw new Error('Razorpay payment gateway SDK failed to load. Please refresh the page.');
      }

      const options = {
        key: razorpayKey,
        amount: razorpay.amount,
        currency: razorpay.currency || 'INR',
        name: 'SHOPPE Hardware',
        description: `Order #${order.order_number}`,
        order_id: razorpay.order_id,
        prefill: {
          name: order.shipping_address?.full_name || '',
          contact: order.shipping_address?.phone || '',
        },
        theme: {
          color: '#111827',
        },
        handler: async function (response) {
          try {
            // Verify payment signature on backend
            await checkoutApi.verifyPayment({
              orderId: order.id,
              orderNumber: order.order_number,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Track purchase event
            eventsApi.track('purchase', {
              orderId: order.id,
              orderNumber: order.order_number,
              amount: order.total,
              items_count: order.items?.length || 0,
            });

            // Clear active cart store
            clearCart();

            showToast('Payment verified successfully! Redirecting...', 'success');
            navigate(`/order-success/${order.order_number}`);
          } catch (verifyErr) {
            setPaymentError(
              verifyErr.message ||
                'Payment verification failed. If your money was deducted, your order will automatically be settled.'
            );
            showToast('Payment verification failed', 'error');
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setPaymentError(
              'Payment popup was closed before completion. Your stock reservation is held for 15 minutes. You can retry payment below.'
            );
            showToast('Payment window closed. Click retry when ready.', 'warning');
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setIsProcessingPayment(false);
        setPaymentError(
          resp.error?.description || 'Payment failed or was declined by your bank. Please retry.'
        );
        showToast('Payment failed. Please retry.', 'error');
      });

      rzpInstance.open();
    } catch (err) {
      setIsProcessingPayment(false);
      setPaymentError(
        err.message ||
          'Failed to initialize checkout. If items are out of stock, please review your cart.'
      );
      showToast(err.message || 'Checkout failed', 'error');
      // Generate fresh key for subsequent attempt
      idempotencyKeyRef.current = crypto.randomUUID();
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // If cart is empty, show friendly empty state
  if (items.length === 0) {
    return (
      <div className="section" style={{ minHeight: '75vh' }}>
        <div className="container">
          <EmptyState
            title="Your Bag is Empty"
            description="You need at least one product in your shopping bag before proceeding to checkout."
            actionText="Browse Hardware Catalog"
            actionHref="/shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--paper)', minHeight: '90vh', paddingBottom: 'var(--space-64)' }}>
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--paper-subtle)',
          padding: 'var(--space-20) 0',
        }}
      >
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Cart', href: '/cart' },
              { label: 'Secure Checkout' },
            ]}
          />
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
              margin: 'var(--space-12) 0 0 0',
            }}
          >
            Express Checkout
          </h1>
        </div>
      </div>

      <div className="container" style={{ marginTop: 'var(--space-32)' }}>
        {/* ========================================================== */}
        {/* STEP PROGRESS INDICATOR */}
        {/* ========================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '680px',
            marginBottom: 'var(--space-40)',
            position: 'relative',
          }}
        >
          {/* Progress bar background line */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '40px',
              right: '40px',
              height: '3px',
              backgroundColor: 'var(--border)',
              zIndex: 1,
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.3s ease',
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />
          </div>

          {[
            { step: 1, label: 'Delivery Address' },
            { step: 2, label: 'Shipping Method' },
            { step: 3, label: 'Review & Pay' },
          ].map(({ step, label }) => {
            const isCompleted = currentStep > step;
            const isCurrent = currentStep === step;
            return (
              <div
                key={step}
                onClick={() => {
                  if (isCompleted) setCurrentStep(step);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  zIndex: 2,
                  cursor: isCompleted ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted || isCurrent ? 'var(--primary)' : 'var(--paper)',
                    border: `2px solid ${isCompleted || isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                    color: isCompleted || isCurrent ? '#ffffff' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 800,
                    transition: 'all var(--transition-fast)',
                    boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none',
                  }}
                >
                  {isCompleted ? '✓' : step}
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: isCurrent ? 800 : 600,
                    color: isCurrent ? 'var(--ink)' : 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main Two-Column Layout (Step Forms on Left, Single Sticky Card on Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-48)',
            alignItems: 'flex-start',
          }}
        >
          {/* ========================================================== */}
          {/* LEFT: 3 CHECKOUT STEPS (OPEN EDITORIAL, NOT CARDS) */}
          {/* ========================================================== */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* ---------------------------------------------------- */}
            {/* STEP 1: DELIVERY ADDRESS */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                paddingBottom: 'var(--space-32)',
                borderBottom: '1.5px solid var(--border)',
                marginBottom: 'var(--space-32)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-16)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--ink)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    1
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    Delivery Address
                  </h2>
                </div>

                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Change Address
                  </button>
                )}
              </div>

              {currentStep === 1 ? (
                <div>
                  {isAddressesLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ height: '70px', backgroundColor: 'var(--paper-subtle)', borderRadius: 'var(--radius-md)' }} />
                    </div>
                  ) : addresses.length > 0 && !showAddAddressForm ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            style={{
                              padding: '16px 20px',
                              borderRadius: 'var(--radius-md)',
                              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--paper)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <input
                              type="radio"
                              name="selected_address"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              style={{ marginTop: '3px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                                  {addr.full_name}
                                </strong>
                                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                  ({addr.phone})
                                </span>
                                {addr.is_default && (
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: 'var(--radius-pill)',
                                      backgroundColor: 'var(--ink)',
                                      color: '#ffffff',
                                    }}
                                  >
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '4px', lineHeight: '20px' }}>
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ''}
                                <br />
                                {addr.city}, {addr.state} — <strong>{addr.pincode}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-16)' }}>
                        <Button
                          size="md"
                          variant="primary"
                          onClick={() => setCurrentStep(2)}
                          disabled={!selectedAddressId}
                        >
                          Deliver to this Address →
                        </Button>
                        <Button
                          size="md"
                          variant="secondary"
                          onClick={() => setShowAddAddressForm(true)}
                        >
                          + Add New Address
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Inline New Address Form with 6-digit Pincode Validation */
                    <form onSubmit={handleCreateAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <Input
                          label="Full Name"
                          placeholder="e.g. John Doe"
                          value={addressForm.full_name}
                          error={addressErrors.full_name}
                          onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                        />
                        <Input
                          label="Mobile Phone (10 digits)"
                          placeholder="9876543210"
                          value={addressForm.phone}
                          error={addressErrors.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>

                      <Input
                        label="Address Line 1"
                        placeholder="House / Flat No., Apartment / Building Name"
                        value={addressForm.line1}
                        error={addressErrors.line1}
                        onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                      />

                      <Input
                        label="Address Line 2 (Optional)"
                        placeholder="Street, Landmark, Area"
                        value={addressForm.line2}
                        onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <Input
                          label="City"
                          placeholder="Bengaluru"
                          value={addressForm.city}
                          error={addressErrors.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        />
                        <Input
                          label="State"
                          placeholder="Karnataka"
                          value={addressForm.state}
                          error={addressErrors.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        />
                        <Input
                          label="Pincode (6 digits)"
                          placeholder="560001"
                          value={addressForm.pincode}
                          error={addressErrors.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        />
                      </div>

                      <Checkbox
                        label="Set as default shipping address"
                        checked={addressForm.is_default}
                        onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                      />

                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <Button size="md" variant="primary" type="submit" isLoading={addressSubmitting}>
                          Save & Use Address
                        </Button>
                        {addresses.length > 0 && (
                          <Button size="md" variant="ghost" type="button" onClick={() => setShowAddAddressForm(false)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Completed Step 1 Summary */
                selectedAddress && (
                  <div style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '22px' }}>
                    <strong>{selectedAddress.full_name}</strong> ({selectedAddress.phone})
                    <br />
                    {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}
                  </div>
                )
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* STEP 2: SHIPPING METHOD */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                paddingBottom: 'var(--space-32)',
                borderBottom: '1.5px solid var(--border)',
                marginBottom: 'var(--space-32)',
                opacity: currentStep < 2 ? 0.45 : 1,
                pointerEvents: currentStep < 2 ? 'none' : 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-16)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: currentStep >= 2 ? 'var(--ink)' : 'var(--border)',
                      color: currentStep >= 2 ? '#ffffff' : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    2
                  </span>
                  <h2
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '20px',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    Shipping Method
                  </h2>
                </div>

                {currentStep > 2 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Change Shipping
                  </button>
                )}
              </div>

              {currentStep === 2 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                  {/* Option 1: Standard Priority Shipping */}
                  <div
                    onClick={() => setShippingOption('standard')}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${shippingOption === 'standard' ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: shippingOption === 'standard' ? 'var(--primary-light)' : 'var(--paper)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="shipping_option"
                        checked={shippingOption === 'standard'}
                        onChange={() => setShippingOption('standard')}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                          Standard Ground / Surface Delivery
                        </strong>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                          Estimated delivery in 3–5 business days
                        </div>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 800 }}>
                      {subtotal >= free_shipping_threshold ? (
                        <span style={{ color: 'var(--success)' }}>FREE</span>
                      ) : (
                        '₹99'
                      )}
                    </span>
                  </div>

                  {/* Option 2: Express Priority Air */}
                  <div
                    onClick={() => setShippingOption('express')}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${shippingOption === 'express' ? 'var(--primary)' : 'var(--border)'}`,
                      backgroundColor: shippingOption === 'express' ? 'var(--primary-light)' : 'var(--paper)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="shipping_option"
                        checked={shippingOption === 'express'}
                        onChange={() => setShippingOption('express')}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                          Express Priority Air Shipping ⚡
                        </strong>
                        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                          Guaranteed expedited courier within 1–2 business days
                        </div>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>
                      ₹199
                    </span>
                  </div>

                  <div style={{ marginTop: 'var(--space-16)' }}>
                    <Button size="md" variant="primary" onClick={() => setCurrentStep(3)}>
                      Continue to Payment →
                    </Button>
                  </div>
                </div>
              ) : (
                /* Completed Step 2 Summary */
                <div style={{ fontSize: '14px', color: 'var(--slate)' }}>
                  {shippingOption === 'express'
                    ? 'Express Priority Air (1–2 business days) • ₹199'
                    : `Standard Ground (3–5 business days) • ${subtotal >= free_shipping_threshold ? 'FREE' : '₹99'}`}
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* STEP 3: PAYMENT & REVIEW */}
            {/* ---------------------------------------------------- */}
            <div
              style={{
                opacity: currentStep < 3 ? 0.45 : 1,
                pointerEvents: currentStep < 3 ? 'none' : 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-16)' }}>
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: currentStep === 3 ? 'var(--ink)' : 'var(--border)',
                    color: currentStep === 3 ? '#ffffff' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  3
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--ink)',
                    margin: 0,
                  }}
                >
                  Payment & Final Review
                </h2>
              </div>

              {currentStep === 3 && (
                <div>
                  {/* Reservation Notice */}
                  {reservationNotice && (
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #3B82F6',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        color: '#1E40AF',
                        marginBottom: 'var(--space-16)',
                      }}
                    >
                      ⏱ {reservationNotice}
                    </div>
                  )}

                  {/* Payment Error Alert with Retry */}
                  {paymentError && (
                    <div
                      style={{
                        padding: '16px 20px',
                        backgroundColor: 'var(--danger-light)',
                        border: '1.5px solid var(--danger)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-20)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <strong style={{ color: 'var(--danger)', fontSize: '14px' }}>
                        Payment Incomplete or Cancelled:
                      </strong>
                      <div style={{ fontSize: '13px', color: 'var(--ink)' }}>{paymentError}</div>
                      <div style={{ marginTop: '8px' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleInitiatePayment}
                          isLoading={isProcessingPayment}
                        >
                          Retry Payment Now
                        </Button>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'var(--paper-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 'var(--space-24)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                        <line x1="2" y1="10" x2="22" y2="10"></line>
                      </svg>
                      <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>
                        Razorpay Payment Gateway (Test Mode)
                      </strong>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '20px' }}>
                      Supports all major Indian Cards, UPI, NetBanking, and Wallets. When you click Pay Now,
                      your inventory rows will be locked and held for 15 minutes while payment is verified.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    variant="primary"
                    onClick={handleInitiatePayment}
                    isLoading={isProcessingPayment}
                    style={{ width: '100%', fontSize: '16px', fontWeight: 800 }}
                  >
                    {isProcessingPayment ? (
                      'Securing Stock & Opening Razorpay...'
                    ) : (
                      <>Pay <Price price={total} isPaise size="sm" style={{ color: '#ffffff' }} /> via Razorpay →</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT: STICKY ORDER SUMMARY CARD (THE ONLY CARD ON PAGE) */}
          {/* ========================================================== */}
          <div
            style={{
              position: 'sticky',
              top: '100px',
              backgroundColor: 'var(--paper)',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-24)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: '0 0 var(--space-16) 0',
                paddingBottom: 'var(--space-12)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Order Summary ({items.length} items)
            </h3>

            {/* Line items preview */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '220px',
                overflowY: 'auto',
                paddingBottom: 'var(--space-16)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-16)',
              }}
            >
              {items.map((it) => (
                <div key={it.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img
                    src={it.image_url || 'https://picsum.photos/seed/default-cart/100/100'}
                    alt={it.product_name}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-xs)',
                      objectFit: 'cover',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {it.product_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                      Qty: {it.quantity} {it.size ? `• ${it.size}` : ''}
                    </div>
                  </div>
                  <Price price={it.price * it.quantity} isPaise size="sm" />
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingBottom: 'var(--space-16)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: 'var(--space-16)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <Price price={subtotal} isPaise size="sm" />
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--success)' }}>
                  <span>Coupon ({coupon?.code || 'Promo'})</span>
                  <span>-₹{Math.round(discount / 100).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>Shipping ({shippingOption})</span>
                {shippingFee === 0 ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
                ) : (
                  <Price price={shippingFee} isPaise size="sm" />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted)' }}>GST (18%)</span>
                <Price price={tax} isPaise size="sm" />
              </div>
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-16)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 800, color: 'var(--ink)' }}>
                Total Payable
              </span>
              <Price price={total} isPaise size="hero" />
            </div>

            {/* Security Guarantee Note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--muted)',
                backgroundColor: 'var(--paper-subtle)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Idempotent transaction with 15-minute stock guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
