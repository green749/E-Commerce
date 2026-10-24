import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function CollectionsPage() {
  useEffect(() => {
    document.title = 'Curated Collections — pure origin Clean Botanical Skincare';
    eventsApi.track('page_view', { page: '/collections', title: 'Collections — pure origin' });
  }, []);

  const collections = [
    {
      title: 'The Best Sellers Collection',
      tag: 'MOST LOVED',
      description: 'Our most awarded and celebrated daily essentials. Proven barrier repair, vibrant radiance, and pure organic nourishment.',
      link: '/shop?collection=bestsellers',
      img: '/images/hero.jpg',
    },
    {
      title: 'The Radiance Glow Ritual',
      tag: 'ILLUMINATING',
      description: 'Supercharged botanicals formulated with stabilizing Vitamin C, Kakadu plum, and rosehip oil to brighten hyperpigmentation.',
      link: '/shop?category=serums',
      img: '/images/cat-serums.jpg',
    },
    {
      title: 'Deep Barrier Repair & Moisture',
      tag: 'NOURISHING',
      description: 'Ceramides, squalane, and whipped organic shea butter formulated to soothe stressed or barrier-compromised skin.',
      link: '/shop?category=moisturizers',
      img: '/images/cat-moisturizers.jpg',
    },
    {
      title: 'Eco-Refills & Starter Sets',
      tag: 'SUSTAINABLE',
      description: 'Save 20% on refills while helping eliminate virgin plastic waste. Complete with reusable glass and pouch options.',
      link: '/shop?category=refills-sets',
      img: '/images/refill.jpg',
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
            BOTANICAL CURATIONS
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
            Curated For Every Skin Need.
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#5e6b5f', maxWidth: '600px', margin: '0 auto' }}>
            Discover targeted systems designed to work synergistically for maximum cellular absorption and barrier resilience.
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '36px',
            }}
          >
            {collections.map((col, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid #eae3d8',
                  boxShadow: '0 12px 30px rgba(30, 56, 43, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                  <img
                    src={col.img}
                    alt={col.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      backgroundColor: 'rgba(30, 56, 43, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '4px',
                    }}
                  >
                    {col.tag}
                  </div>
                </div>

                <div style={{ padding: '32px 28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 600, color: '#1e382b', marginBottom: '10px' }}>
                      {col.title}
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#5e6b5f', marginBottom: '24px' }}>
                      {col.description}
                    </p>
                  </div>

                  <div>
                    <Link
                      to={col.link}
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
                      Shop Collection →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CollectionsPage;
