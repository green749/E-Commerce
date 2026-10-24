import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function AboutPage() {
  useEffect(() => {
    document.title = 'Our Story — pure origin Clean Botanical Skincare';
    eventsApi.track('page_view', { page: '/about', title: 'Our Story — pure origin' });
  }, []);

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b' }}>
      {/* Editorial Hero Header */}
      <section
        style={{
          padding: '80px 0 60px',
          backgroundColor: '#f5f0ea',
          borderBottom: '1px solid #e6ded3',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1e382b' }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 26V13" />
              <path d="M14 13C10 9 6 10 5 14c0 5 5 7 9 9" />
              <path d="M14 13C18 9 22 10 23 14c0 5-5 7-9 9" />
              <path d="M14 8c-2-3-5-4-7-3 0 3 2 5 7 6" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              ABOUT PURE ORIGIN
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(40px, 5vw, 60px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              color: '#1e382b',
              margin: '0 0 20px 0',
            }}
          >
            Skincare Born In Nature.<br />Formulated Without Compromise.
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.65,
              color: '#5e6b5f',
              margin: '0 auto 32px',
              maxWidth: '620px',
            }}
          >
            We founded Pure Origin on a simple truth: skincare should never force you to choose between potent efficacy, clean integrity, and ecological reverence.
          </p>

          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              backgroundColor: '#1e382b',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 34px',
              borderRadius: '4px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(30, 56, 43, 0.2)',
            }}
          >
            Explore The Formulations
          </Link>
        </div>
      </section>

      {/* Story & Philosophy Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', marginBottom: '12px' }}>
                OUR PHILOSOPHY
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '36px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: '#1e382b',
                  marginBottom: '20px',
                }}
              >
                Full ingredient transparency. Nothing to hide.
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#5e6b5f', marginBottom: '16px' }}>
                Every droplet of serum, jar of whipped moisturizer, and botanical cleansing wash is crafted from nutrient-dense wildcrafted plants, cold-pressed seed oils, and bioactive phytonutrients harvested at peak potency.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#5e6b5f', marginBottom: '28px' }}>
                We ban over 2,800 questionable substances—including synthetic dyes, artificial fragrances, silicones, sulfates, parabens, and phthalates. What remains is honest nourishment that harmonizes with your cellular lipid barrier.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid #ded6c9' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: '#1e382b' }}>100%</div>
                  <div style={{ fontSize: '12px', color: '#687367' }}>Cruelty-Free & Vegan</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: '#1e382b' }}>Zero</div>
                  <div style={{ fontSize: '12px', color: '#687367' }}>Synthetic Additives</div>
                </div>
              </div>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 16px 36px rgba(30, 56, 43, 0.12)' }}>
              <img
                src="/images/science.jpg"
                alt="Botanical Extraction in glass laboratory dish"
                style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Sourcing Banner */}
      <section style={{ padding: '60px 0', backgroundColor: '#eae3d8', borderTop: '1px solid #ded6c9', borderBottom: '1px solid #ded6c9' }}>
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: '#1e382b', marginBottom: '16px' }}>
              Responsible Wildcrafting & Eco-Refills
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#5e6b5f', marginBottom: '24px' }}>
              Our recyclable aluminum vessels and lightweight refill pouches reduce carbon emissions during transport by up to 82%. By choosing Pure Origin, you help divert tons of single-use virgin plastics from our oceans.
            </p>
            <Link
              to="/impact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#1e382b',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderBottom: '1.5px solid #1e382b',
                paddingBottom: '2px',
              }}
            >
              Learn More About Our Environmental Impact →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
