import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function ShippingReturnsPage() {
  useEffect(() => {
    document.title = 'Shipping & 30-Day Clean Guarantee — pure origin';
    eventsApi.track('page_view', { page: '/shipping', title: 'Shipping & Returns — pure origin' });
  }, []);

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b', minHeight: '80vh', padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '8px' }}>
            ORDER PEACE OF MIND
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 500, color: '#1e382b', margin: 0 }}>
            Shipping & Return Policies
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Shipping Policy */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #eae3d8', padding: '36px', boxShadow: '0 4px 16px rgba(30, 56, 43, 0.04)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: '#1e382b', marginBottom: '16px' }}>
              Carbon-Neutral Shipping
            </h2>
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#5e6b5f' }}>
              <p style={{ margin: '0 0 12px' }}>
                We partner with certified green delivery networks to offset 100% of transport carbon emissions for every order dispatched.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Free Shipping:</strong> Automatically applied to all orders above ₹500 across India.</li>
                <li><strong>Flat Rate:</strong> A modest ₹60 delivery fee applies on orders below ₹500.</li>
                <li><strong>Delivery Speed:</strong> Dispatched within 24 hours. Metro deliveries arrive in 2-3 business days; regional in 3-5 business days.</li>
                <li><strong>Plastic-Free Packaging:</strong> Orders are protected with biodegradable shredded kraft paper and paper tape.</li>
              </ul>
            </div>
          </div>

          {/* Returns & Guarantee */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #eae3d8', padding: '36px', boxShadow: '0 4px 16px rgba(30, 56, 43, 0.04)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: '#1e382b', marginBottom: '16px' }}>
              30-Day Clean Beauty Guarantee
            </h2>
            <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#5e6b5f' }}>
              <p style={{ margin: '0 0 12px' }}>
                Skin is deeply personal, and adjusting to a clean routine takes time. If a product does not deliver results or cause skin incompatibility, you have a full 30 days from delivery to request a return or exchange.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Self-Service Returns:</strong> Visit your <Link to="/account/orders" style={{ color: '#1e382b', fontWeight: 600 }}>Order History</Link> and select "Request Return".</li>
                <li><strong>Prompt Refunds:</strong> Once our warehouse inspects the return package, refunds are credited back to your original payment method within 3 to 5 business days.</li>
                <li><strong>Eco-Friendly Exchanges:</strong> You may also choose store credit to try another formula tailored to your specific skin needs.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingReturnsPage;
