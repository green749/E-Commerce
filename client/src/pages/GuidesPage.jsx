import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function GuidesPage() {
  useEffect(() => {
    document.title = 'Clean Skincare Rituals & Guides — pure origin';
    eventsApi.track('page_view', { page: '/guides', title: 'Guides — pure origin' });
  }, []);

  const guides = [
    {
      title: 'The Morning Barrier Defense Ritual',
      subtitle: 'Shielding skin from free-radical pollution and moisture loss throughout the day',
      steps: [
        { num: '01', name: 'Cleanse', text: 'Wash gently with Botanical Cleanser using lukewarm water. Never strip the acid mantle.' },
        { num: '02', name: 'Illuminate', text: 'Apply 3-4 drops of Vitamin C Glow Serum onto clean, slightly damp skin.' },
        { num: '03', name: 'Lock & Quench', text: 'Smooth a pea-sized amount of Radiance Moisturizer across face, neck, and décolletage.' },
        { num: '04', name: 'Shield', text: 'Generously apply Mineral Sunscreen SPF 50 as the final non-negotiable step.' },
      ],
      ctaText: 'Shop Morning Essentials',
      category: 'cleansers',
    },
    {
      title: 'The Evening Deep Cell Repair Ritual',
      subtitle: 'Unwind impurities and accelerate nocturnal cellular lipid regeneration',
      steps: [
        { num: '01', name: 'Dissolve', text: 'Massage Nourishing Cleansing Balm to break down SPF, sebum, and micro-pollutants.' },
        { num: '02', name: 'Deep Cleanse', text: 'Follow with Botanical Cleanser for a clean slate ready for active absorption.' },
        { num: '03', name: 'Target', text: 'Pat in Deep Hydration Hyaluronic Serum or Bakuchiol Youth Elixir.' },
        { num: '04', name: 'Restore', text: 'Seal with 2 drops of Organic Rosehip Seed Oil for pillow-soft morning radiance.' },
      ],
      ctaText: 'Shop Evening Ritual',
      category: 'serums',
    },
    {
      title: 'The Art of Double Cleansing Explained',
      subtitle: 'Why oil-based cleansers followed by botanical wash transforms texture and pore clarity',
      steps: [
        { num: '01', name: 'Like Attracts Like', text: 'Lipophilic oils effortlessly dissolve stubborn water-resistant sunscreens and excess sebum.' },
        { num: '02', name: 'Zero Stripping', text: 'Leaves the delicate skin moisture barrier intact without tightness or irritation.' },
        { num: '03', name: 'Water-Soluble Rinse', text: 'Gentle surfactants wash away micro-debris without leaving residue behind.' },
      ],
      ctaText: 'Explore Double Cleansers',
      category: 'cleansers',
    },
  ];

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
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '12px' }}>
            BOTANICAL EDUCATION & RITUALS
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
            Nourish Intentionally.<br />Master Your Clean Ritual.
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#5e6b5f', maxWidth: '620px', margin: '0 auto' }}>
            Formulation knowledge combined with intentional daily application delivers visible dermatological results without harsh chemical interventions.
          </p>
        </div>
      </section>

      {/* Guides List */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', maxWidth: '960px', margin: '0 auto' }}>
            {guides.map((guide, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #eae3d8',
                  padding: '48px 40px',
                  boxShadow: '0 10px 30px rgba(30, 56, 43, 0.05)',
                }}
              >
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: '#1e382b', marginBottom: '8px' }}>
                    {guide.title}
                  </h2>
                  <p style={{ fontSize: '15px', color: '#5e6b5f', margin: 0 }}>
                    {guide.subtitle}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                  }}
                >
                  {guide.steps.map((st, sIdx) => (
                    <div key={sIdx} style={{ backgroundColor: '#fcfaf7', padding: '20px', borderRadius: '8px', border: '1px solid #f0e9df' }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: '#b4532a', marginBottom: '6px' }}>
                        {st.num}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e382b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                        {st.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#687367', lineHeight: 1.55 }}>
                        {st.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <Link
                    to={`/shop?category=${guide.category}`}
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
                    {guide.ctaText} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default GuidesPage;
