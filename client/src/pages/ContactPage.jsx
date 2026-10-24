import React, { useState, useEffect } from 'react';
import { eventsApi } from '../api/events.js';

export function ContactPage() {
  useEffect(() => {
    document.title = 'Contact Us — pure origin Botanical Concierge';
    eventsApi.track('page_view', { page: '/contact', title: 'Contact — pure origin' });
  }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: 'Skincare Consultation', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b', minHeight: '80vh', padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '8px' }}>
            GET IN TOUCH
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 500, color: '#1e382b', margin: 0 }}>
            Contact Our Botanical Concierge
          </h1>
          <p style={{ fontSize: '15px', color: '#5e6b5f', marginTop: '12px' }}>
            Have a question regarding rituals, ingredients, order status, or refills? We are here to help.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #eae3d8',
            padding: '44px',
            boxShadow: '0 10px 30px rgba(30, 56, 43, 0.05)',
          }}
        >
          {/* Left: Contact Info */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: '#1e382b', marginBottom: '20px' }}>
              Pure Origin Studio & Lab
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', color: '#5e6b5f', lineHeight: 1.6 }}>
              <div>
                <strong style={{ color: '#1e382b', display: 'block', marginBottom: '2px' }}>Concierge Email:</strong>
                concierge@pureoriginbeauty.com
              </div>
              <div>
                <strong style={{ color: '#1e382b', display: 'block', marginBottom: '2px' }}>Customer Hotline:</strong>
                +91 (800) 425-PURE (Mon-Fri, 9am - 6pm IST)
              </div>
              <div>
                <strong style={{ color: '#1e382b', display: 'block', marginBottom: '2px' }}>Formulation Laboratory:</strong>
                42 Botanical Sanctuary Way, Green Innovation Corridor, Bangalore, Karnataka 560001
              </div>
            </div>

            <div style={{ marginTop: '36px', padding: '20px', backgroundColor: '#eae3d8', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Quick Response Guarantee
              </div>
              <div style={{ fontSize: '13px', color: '#687367' }}>
                All consultations and customer inquiries are answered by certified skincare specialists within 24 business hours.
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            {submitted ? (
              <div style={{ padding: '32px', backgroundColor: '#f5f0ea', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px' }}>
                  Message Received
                </h3>
                <p style={{ fontSize: '14px', color: '#5e6b5f', margin: 0 }}>
                  Thank you for reaching out. A Pure Origin skincare advisor will respond to your inquiry shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e382b', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Sarah Mitchell"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #c8c0b1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e382b', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sarah@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #c8c0b1',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e382b', marginBottom: '6px' }}>
                    Topic
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #c8c0b1',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <option>Skincare Routine Consultation</option>
                    <option>Order & Shipping Assistance</option>
                    <option>Refill Program Inquiry</option>
                    <option>Wholesale & Press Partnership</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#1e382b', marginBottom: '6px' }}>
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we assist your skin wellness today?"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid #c8c0b1',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: '#1e382b',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '14px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  Send Inquiry →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
