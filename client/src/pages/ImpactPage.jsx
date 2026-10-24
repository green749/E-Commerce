import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function ImpactPage() {
  useEffect(() => {
    document.title = 'Our Impact — pure origin Sustainability & Planetary Commitment';
    eventsApi.track('page_view', { page: '/impact', title: 'Our Impact — pure origin' });
  }, []);

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b' }}>
      {/* Hero Header */}
      <section
        style={{
          padding: '80px 0 60px',
          backgroundColor: '#f5f0ea',
          borderBottom: '1px solid #e6ded3',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '12px' }}>
            PLANETARY RESPONSIBILITY
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(38px, 5vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: '#1e382b',
              margin: '0 0 20px 0',
            }}
          >
            Sustainable Skincare.<br />Measurable Ecological Impact.
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#5e6b5f', maxWidth: '640px', margin: '0 auto' }}>
            We measure our success not just by healthy skin transformations, but by the weight of plastic diverted, the purity of our supply chain, and our direct contribution to planetary regeneration.
          </p>
        </div>
      </section>

      {/* 4 Pillars Deep Dive */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '32px',
              marginBottom: '60px',
            }}
          >
            {/* Pillar 1 */}
            <div
              style={{
                backgroundColor: '#eae3d8',
                padding: '36px 28px',
                borderRadius: '12px',
                border: '1px solid #ded6c9',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: '#1e382b', marginBottom: '8px' }}>
                100%
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#1e382b', marginBottom: '12px' }}>
                Recyclable Materials
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5e6b5f', margin: 0 }}>
                Every bottle is made from infinitely recyclable aluminum or ultraviolet-protective glass. Outer boxes are unbleached FSC-certified post-consumer recycled paper printed with soy inks.
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              style={{
                backgroundColor: '#eae3d8',
                padding: '36px 28px',
                borderRadius: '12px',
                border: '1px solid #ded6c9',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: '#1e382b', marginBottom: '8px' }}>
                93%+
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#1e382b', marginBottom: '12px' }}>
                Natural Origin Bioactives
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5e6b5f', margin: 0 }}>
                Formulas are powered by certified organic botanicals, cold-pressed seed lipids, and fermented actives that biodegrade safely back into the soil and waterways without bioaccumulation.
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              style={{
                backgroundColor: '#eae3d8',
                padding: '36px 28px',
                borderRadius: '12px',
                border: '1px solid #ded6c9',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: '#1e382b', marginBottom: '8px' }}>
                Zero
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#1e382b', marginBottom: '12px' }}>
                Animal Testing (Cruelty-Free)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5e6b5f', margin: 0 }}>
                Certified cruelty-free and 100% vegan. We never test on animals or commission third-party animal testing anywhere in the world.
              </p>
            </div>

            {/* Pillar 4 */}
            <div
              style={{
                backgroundColor: '#eae3d8',
                padding: '36px 28px',
                borderRadius: '12px',
                border: '1px solid #ded6c9',
              }}
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: '#1e382b', marginBottom: '8px' }}>
                1%
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#1e382b', marginBottom: '12px' }}>
                For The Planet Member
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5e6b5f', margin: 0 }}>
                One percent of every gross rupee in sales is directly funneled to grassroots environmental non-profits fighting for rainforest restoration and ocean cleanup.
              </p>
            </div>
          </div>

          {/* Refill Revolution Section */}
          <div
            style={{
              backgroundColor: '#1e382b',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '48px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#eae3d8' }}>
                THE REFILL ECOSYSTEM
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 600, color: '#ffffff', margin: '8px 0 16px' }}>
                Refill. Reuse. Renew.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(255, 255, 255, 0.85)', marginBottom: '24px' }}>
                By keeping your primary glass or aluminum pump bottle and using our concentrated paper-backed refill pouches, you eliminate 82% of greenhouse shipping emissions per replenishment.
              </p>
              <Link
                to="/shop?category=refills-sets"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#b4532a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '14px 32px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                Shop Refill Pouches & Pods
              </Link>
            </div>

            <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <img
                src="/images/refill.jpg"
                alt="Sustainable skincare refill pouch pouring into reusable green glass vessel"
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ImpactPage;
