import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function FaqPage() {
  useEffect(() => {
    document.title = 'Frequently Asked Questions — pure origin';
    eventsApi.track('page_view', { page: '/faq', title: 'FAQ — pure origin' });
  }, []);

  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: 'Are all Pure Origin products certified clean and cruelty-free?',
      a: 'Yes, 100%. We are Leaping Bunny certified cruelty-free, vegan, and formulate in compliance with EU clean cosmetics standards—banning over 2,800 potentially toxic or irritating substances.',
    },
    {
      q: 'What makes your refill system more sustainable than standard bottles?',
      a: 'Our lightweight refill pouches use 82% less plastic by weight than standard rigid cosmetic bottles and produce significantly lower transport emissions. Once you have our permanent glass pump bottle, you simply refill and reuse.',
    },
    {
      q: 'How long does shipping take and is delivery free?',
      a: 'We offer free carbon-neutral shipping across India on all orders over ₹500. Standard delivery typically takes 2 to 4 business days. Express shipping is also available at checkout.',
    },
    {
      q: 'What is your 30-Day Clean Beauty Guarantee?',
      a: 'We want you to love your ritual. If a product does not suit your skin, you can request an easy return or exchange within 30 days of delivery directly through your account dashboard.',
    },
    {
      q: 'How should I store my botanical skincare products?',
      a: 'Because our formulas use cold-pressed active botanicals without synthetic chemical preservatives, we recommend storing them in a cool, dry place away from direct sunlight. Most unopened items maintain peak potency for 24 months, and 12 months after opening.',
    },
    {
      q: 'Are your products safe for pregnant and nursing mothers?',
      a: 'Most of our core products (such as our Botanical Cleanser and Whipped Radiance Moisturizer) are formulated to be ultra-gentle. However, we always recommend reviewing our full ingredient transparency list with your healthcare provider.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b', minHeight: '80vh', padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '8px' }}>
            HELP & CONCIERGE
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 500, color: '#1e382b', margin: 0 }}>
            Frequently Asked Questions
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((item, index) => {
            const isOpen = openIdx === index;
            return (
              <div
                key={index}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #eae3d8',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(30, 56, 43, 0.04)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? -1 : index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: '#1e382b',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '18px',
                    fontWeight: 600,
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ fontSize: '20px', marginLeft: '16px', color: '#b4532a', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                    +
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 24px 22px', fontSize: '14px', lineHeight: 1.65, color: '#5e6b5f', borderTop: '1px solid #f4efe8', paddingTop: '16px' }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px', padding: '32px', backgroundColor: '#eae3d8', borderRadius: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px' }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: '14px', color: '#5e6b5f', margin: '0 0 16px' }}>
            Our botanical skincare concierge is available Monday through Friday.
          </p>
          <Link
            to="/contact"
            style={{
              display: 'inline-block',
              backgroundColor: '#1e382b',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Contact Customer Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}

export default FaqPage;
