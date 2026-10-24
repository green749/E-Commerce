import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function HomePage() {
  // Track page view event on mount
  useEffect(() => {
    eventsApi.track('page_view', {
      page: '/',
      path: window.location.pathname,
      title: 'pure origin — Clean Botanical Skincare & Sustainable Beauty',
    });
  }, []);

  // Testimonials slider state
  const testimonials = [
    {
      id: 1,
      quote: 'My skin has never felt better. Clean, effective, and honest!',
      author: 'Sarah M.',
      verified: 'Verified Customer',
    },
    {
      id: 2,
      quote: 'Finally, skincare I can feel good about using every single day.',
      author: 'Jessica L.',
      verified: 'Verified Customer',
    },
    {
      id: 3,
      quote: 'Beautiful products with real results and values. The face oil is magic.',
      author: 'Maya R.',
      verified: 'Verified Customer',
    },
    {
      id: 4,
      quote: 'The whipped radiance moisturizer saved my winter skin barrier.',
      author: 'Elena R.',
      verified: 'Verified Customer',
    },
  ];

  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonials = [
    testimonials[testimonialIndex % testimonials.length],
    testimonials[(testimonialIndex + 1) % testimonials.length],
    testimonials[(testimonialIndex + 2) % testimonials.length],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fcfaf7' }}>
      {/* ==================================================================== */}
      {/* 1. HERO SECTION: "Beauty With Nothing To Hide."                     */}
      {/* ==================================================================== */}
      <section
        style={{
          position: 'relative',
          backgroundColor: '#f5f0ea', // Sunlit warm linen
          backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.7) 0%, transparent 60%)',
          padding: '60px 0 80px',
          overflow: 'hidden',
          borderBottom: '1px solid #e6ded3',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            {/* Left Content Column */}
            <div style={{ maxWidth: '540px' }}>
              {/* Botanical Leaf Icon */}
              <div style={{ marginBottom: '16px' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#1e382b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 28V14" />
                  <path d="M16 14C11 9 7 11 6 15c0 6 6 8 10 11" />
                  <path d="M16 14C21 9 25 11 26 15c0 6-6 8-10 11" />
                  <path d="M16 9c-3-4-6-4-8-3 0 4 3 6 8 7" />
                </svg>
              </div>

              {/* Huge Serif Headline */}
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(44px, 5.5vw, 68px)',
                  fontWeight: 500,
                  lineHeight: 1.04,
                  letterSpacing: '-0.015em',
                  color: '#1e382b',
                  margin: '0 0 20px 0',
                }}
              >
                Beauty With
                <br />
                Nothing To Hide.
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  color: '#5e6b5f',
                  lineHeight: 1.6,
                  margin: '0 0 28px 0',
                  maxWidth: '420px',
                }}
              >
                Clean ingredients. Honest products.
                <br />
                Better for you and the planet.
              </p>

              {/* Primary CTA Button */}
              <div style={{ marginBottom: '44px' }}>
                <Link
                  to="/shop"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#1e382b',
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '16px 36px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(30, 56, 43, 0.2)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#294c3a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e382b';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  SHOP CLEAN BEAUTY
                </Link>
              </div>

              {/* 4 Circular Value Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(222, 216, 203, 0.7)',
                }}
              >
                {/* 1. Natural Ingredients */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid #c8c0b1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      color: '#1e382b',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                    </svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e382b', lineHeight: 1.25 }}>
                    Natural<br />Ingredients
                  </span>
                </div>

                {/* 2. Cruelty Free */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid #c8c0b1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      color: '#1e382b',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e382b', lineHeight: 1.25 }}>
                    Cruelty<br />Free
                  </span>
                </div>

                {/* 3. Eco Friendly */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid #c8c0b1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      color: '#1e382b',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                      <path d="M2 12h20"></path>
                    </svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e382b', lineHeight: 1.25 }}>
                    Eco<br />Friendly
                  </span>
                </div>

                {/* 4. Made With Integrity */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid #c8c0b1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      color: '#1e382b',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1e382b', lineHeight: 1.25 }}>
                    Made With<br />Integrity
                  </span>
                </div>
              </div>
            </div>

            {/* Right Product Image Column (Pure Origin hero arrangement) */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '580px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(30, 56, 43, 0.12)',
                }}
              >
                <img
                  src="/images/hero.jpg"
                  alt="Pure Origin Botanical Skanser, Radiance Glow Moisturizer, Face Oil and SPF on sunlit sandstone"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. FIVE-ITEM VALUES STRIP (Soft warm sand bar)                      */}
      {/* ==================================================================== */}
      <section
        style={{
          backgroundColor: '#eae3d8', // Exact warm linen tone from reference image
          padding: '24px 0',
          borderBottom: '1px solid #ded6c9',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* 1. Ingredient Transparency */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1e382b', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', letterSpacing: '0.02em' }}>
                  Ingredient Transparency
                </div>
                <div style={{ fontSize: '11px', color: '#687367' }}>Full disclosure, always.</div>
              </div>
            </div>

            {/* 2. Ethically Sourced */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1e382b', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', letterSpacing: '0.02em' }}>
                  Ethically Sourced
                </div>
                <div style={{ fontSize: '11px', color: '#687367' }}>Responsibly from nature.</div>
              </div>
            </div>

            {/* 3. Refillable By Design */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1e382b', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                  <path d="M16 21h5v-5"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', letterSpacing: '0.02em' }}>
                  Refillable By Design
                </div>
                <div style={{ fontSize: '11px', color: '#687367' }}>Less waste, more beauty.</div>
              </div>
            </div>

            {/* 4. Sustainable Packaging */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1e382b', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', letterSpacing: '0.02em' }}>
                  Sustainable Packaging
                </div>
                <div style={{ fontSize: '11px', color: '#687367' }}>Better materials, smaller footprint.</div>
              </div>
            </div>

            {/* 5. Carbon Conscious */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ color: '#1e382b', flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b', letterSpacing: '0.02em' }}>
                  Carbon Conscious
                </div>
                <div style={{ fontSize: '11px', color: '#687367' }}>We offset what we can't.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. "SHOP BY NATURE" (5 Botanical Arch Category Cards)               */}
      {/* ==================================================================== */}
      <section style={{ padding: '72px 0 64px' }}>
        <div className="container">
          {/* Centered Serif Section Title with Dividers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '44px',
            }}
          >
            <div style={{ width: '40px', height: '1px', backgroundColor: '#c8c0b1' }} />
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '24px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1e382b',
                margin: 0,
              }}
            >
              SHOP BY NATURE
            </h2>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#c8c0b1' }} />
          </div>

          {/* 5 Arch Category Cards Grid matching reference */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '20px',
              marginBottom: '40px',
            }}
            className="category-arch-grid"
          >
            {[
              {
                name: 'Cleansers',
                subtitle: 'Pure & Gentle',
                slug: 'cleansers',
                img: '/images/cat-cleansers.jpg',
              },
              {
                name: 'Serums',
                subtitle: 'Targeted Care',
                slug: 'serums',
                img: '/images/cat-serums.jpg',
              },
              {
                name: 'Moisturizers',
                subtitle: 'Daily Hydration',
                slug: 'moisturizers',
                img: '/images/cat-moisturizers.jpg',
              },
              {
                name: 'Masks',
                subtitle: 'Botanical Boost',
                slug: 'masks',
                img: '/images/cat-masks.jpg',
              },
              {
                name: 'Body Care',
                subtitle: 'Nourish Naturally',
                slug: 'body-care',
                img: '/images/cat-bodycare.jpg',
              },
            ].map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Arch-Shaped Top Image Frame */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '3/4',
                    borderRadius: '120px 120px 8px 8px', // Distinctive arch shape from screenshot
                    overflow: 'hidden',
                    backgroundColor: '#eae3d9',
                    marginBottom: '14px',
                    boxShadow: '0 8px 20px rgba(30, 56, 43, 0.08)',
                  }}
                >
                  <img
                    src={cat.img}
                    alt={cat.name}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1e382b',
                    marginBottom: '2px',
                  }}
                >
                  {cat.name}
                </div>
                <div style={{ fontSize: '11px', color: '#667367' }}>
                  {cat.subtitle}
                </div>
              </Link>
            ))}
          </div>

          {/* Central Terracotta CTA: "VIEW ALL PRODUCTS" */}
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/shop"
              style={{
                display: 'inline-block',
                backgroundColor: '#b4532a', // Warm rich terracotta matching screenshot
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '14px 34px',
                borderRadius: '4px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(180, 83, 42, 0.25)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#9c441f')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#b4532a')}
            >
              VIEW ALL PRODUCTS
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. DUAL EDITORIAL PROMO BANNERS (Split 50/50)                       */}
      {/* ==================================================================== */}
      <section style={{ padding: '0 0 72px' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Left Card: REFILL. REUSE. RENEW. (Deep Forest Green) */}
            <div
              style={{
                backgroundColor: '#1e382b', // Deep forest green
                borderRadius: '16px',
                overflow: 'hidden',
                color: '#ffffff',
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                boxShadow: '0 12px 32px rgba(30, 56, 43, 0.15)',
              }}
            >
              <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                    margin: '0 0 14px 0',
                    color: '#ffffff',
                  }}
                >
                  REFILL. REUSE.
                  <br />
                  RENEW.
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'rgba(245, 240, 234, 0.8)',
                    lineHeight: 1.5,
                    margin: '0 0 24px 0',
                  }}
                >
                  Our refillable products reduce waste without compromising quality.
                </p>
                <div>
                  <Link
                    to="/shop?category=refills-sets"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderBottom: '1.5px solid #ffffff',
                      paddingBottom: '2px',
                    }}
                  >
                    SHOP REFILLABLES →
                  </Link>
                </div>
              </div>

              <div style={{ position: 'relative', height: '100%', minHeight: '220px' }}>
                <img
                  src="/images/refill.jpg"
                  alt="Pouring sustainable skincare refill into botanical bottle"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>

            {/* Right Card: ROOTED IN NATURE. GUIDED BY SCIENCE. (Warm Linen) */}
            <div
              style={{
                backgroundColor: '#eae4d8', // Warm stone/linen
                borderRadius: '16px',
                overflow: 'hidden',
                color: '#1e382b',
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                boxShadow: '0 12px 32px rgba(30, 56, 43, 0.08)',
              }}
            >
              <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '28px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    lineHeight: 1.15,
                    margin: '0 0 14px 0',
                    color: '#1e382b',
                  }}
                >
                  ROOTED IN NATURE.
                  <br />
                  GUIDED BY SCIENCE.
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#5e6b5f',
                    lineHeight: 1.5,
                    margin: '0 0 24px 0',
                  }}
                >
                  Powerful botanicals. Safe, effective formulas. Visible results.
                </p>
                <div>
                  <Link
                    to="/ingredients"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#1e382b',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderBottom: '1.5px solid #1e382b',
                      paddingBottom: '2px',
                    }}
                  >
                    EXPLORE INGREDIENTS →
                  </Link>
                </div>
              </div>

              <div style={{ position: 'relative', height: '100%', minHeight: '220px' }}>
                <img
                  src="/images/science.jpg"
                  alt="Botanical herbal laboratory extraction in glass petri dish"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. "OUR COMMITMENT TO THE PLANET" (Sustainability Metrics)           */}
      {/* ==================================================================== */}
      <section
        style={{
          padding: '60px 0',
          backgroundColor: '#f5f0ea',
          borderTop: '1px solid #e6ded3',
          borderBottom: '1px solid #e6ded3',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1e382b',
                margin: 0,
              }}
            >
              OUR COMMITMENT TO THE PLANET
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px',
              alignItems: 'center',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            {/* Metric 1: 100% Recyclable Packaging */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
              <div style={{ color: '#1e382b' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"></path>
                  <path d="M11 19h8.2a1.8 1.8 0 0 0 1.57-.88 1.785 1.785 0 0 0 .004-1.78l-3.954-6.84"></path>
                  <path d="M16 11l-3.954-6.84a1.8 1.8 0 0 0-3.138 0L4.954 11"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: '#1e382b', lineHeight: 1 }}>
                  100%
                </div>
                <div style={{ fontSize: '11px', color: '#687367', marginTop: '2px' }}>
                  Recyclable Packaging
                </div>
              </div>
            </div>

            {/* Metric 2: 93% Natural Origin Ingredients */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
              <div style={{ color: '#1e382b' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: '#1e382b', lineHeight: 1 }}>
                  93%
                </div>
                <div style={{ fontSize: '11px', color: '#687367', marginTop: '2px' }}>
                  Natural Origin Ingredients
                </div>
              </div>
            </div>

            {/* Metric 3: Zero Animal Testing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
              <div style={{ color: '#1e382b' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: '#1e382b', lineHeight: 1 }}>
                  Zero
                </div>
                <div style={{ fontSize: '11px', color: '#687367', marginTop: '2px' }}>
                  Animal Testing
                </div>
              </div>
            </div>

            {/* Metric 4: 1% For the Planet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center' }}>
              <div style={{ color: '#1e382b' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1.6px solid #1e382b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  1%
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: '#1e382b', lineHeight: 1 }}>
                  1%
                </div>
                <div style={{ fontSize: '11px', color: '#687367', marginTop: '2px' }}>
                  For the Planet Member
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Monstera Leaf Silhouette on Right */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            opacity: 0.18,
          }}
        >
          <svg width="180" height="180" viewBox="0 0 100 100" fill="#1e382b">
            <path d="M50 10 C30 10 15 25 15 45 C15 70 35 90 50 95 C65 90 85 70 85 45 C85 25 70 10 50 10 Z" />
          </svg>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. "LOVED BY OUR COMMUNITY" (Customer Reviews Slider)               */}
      {/* ==================================================================== */}
      <section style={{ padding: '72px 0 64px' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '36px',
            }}
          >
            <div style={{ width: '40px', height: '1px', backgroundColor: '#c8c0b1' }} />
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#1e382b',
                margin: 0,
              }}
            >
              LOVED BY OUR COMMUNITY
            </h2>
            <div style={{ width: '40px', height: '1px', backgroundColor: '#c8c0b1' }} />
          </div>

          {/* Testimonials Row with Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '1040px', margin: '0 auto' }}>
            {/* Prev Button */}
            <button
              type="button"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#1e382b',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'opacity 0.2s',
              }}
            >
              ←
            </button>

            {/* Testimonials 3-Card Display */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
                flex: 1,
              }}
            >
              {currentTestimonials.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#eae3d9', // Warm linen card tone
                    padding: '28px 24px',
                    borderRadius: '8px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '170px',
                    border: '1px solid rgba(200, 192, 177, 0.5)',
                  }}
                >
                  <div>
                    {/* 5 Warm Gold Stars */}
                    <div style={{ color: '#d4a359', fontSize: '14px', letterSpacing: '2px', marginBottom: '14px' }}>
                      ★★★★★
                    </div>
                    {/* Review Quote */}
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '16px',
                        fontStyle: 'italic',
                        color: '#1e382b',
                        lineHeight: 1.45,
                        margin: '0 0 16px 0',
                      }}
                    >
                      "{item.quote}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e382b' }}>
                      — {item.author}
                    </span>
                    {/* Subtle botanical line sketch */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#889e8a" strokeWidth="1.5">
                      <path d="M12 22V11" />
                      <path d="M12 11c-2-2-5-1-6 2 0 3 3 5 6 6" />
                      <path d="M12 11c2-2 5-1 6 2 0 3-3 5-6 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#1e382b',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'opacity 0.2s',
              }}
            >
              →
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. "NEW HERE? Start Your Clean Beauty Journey" (Starter Kit Band)   */}
      {/* ==================================================================== */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#b4532a', // Rich warm terracotta tone
              backgroundImage: 'linear-gradient(135deg, #ba582e 0%, #9e4420 100%)',
              borderRadius: '20px',
              padding: '36px 40px',
              color: '#ffffff',
              display: 'grid',
              gridTemplateColumns: 'minmax(200px, 300px) 1.4fr auto',
              gap: '32px',
              alignItems: 'center',
              boxShadow: '0 16px 36px rgba(180, 83, 42, 0.25)',
            }}
            className="starter-kit-band"
          >
            {/* Left: Travel Skincare Pouch Image */}
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <img
                src="/images/starter.jpg"
                alt="Pure Origin Clean Beauty Starter Travel Kit Pouch"
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* Center Content */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '8px',
                }}
              >
                NEW HERE?
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(26px, 3.2vw, 36px)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  lineHeight: 1.15,
                  margin: '0 0 10px 0',
                  color: '#ffffff',
                }}
              >
                Start Your Clean Beauty Journey
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0 0 20px 0',
                }}
              >
                Curated essentials for healthy, radiant skin.
              </p>
              <div>
                <Link
                  to="/product/clean-beauty-starter-travel-kit"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#1e382b', // Deep forest green button
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '12px 28px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  DISCOVER STARTER KITS
                </Link>
              </div>
            </div>

            {/* Right: Circular Badge Stamp */}
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 240, 234, 0.92)',
                color: '#1e382b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="1.6" style={{ marginBottom: '4px' }}>
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                <path d="M12 12L2.5 7.5"></path>
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '9px',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  lineHeight: 1.25,
                }}
              >
                PERFECT FOR SENSITIVE SKIN & BEGINNERS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. PRE-FOOTER TRUST ROW (4 Badges)                                 */}
      {/* ==================================================================== */}
      <section
        style={{
          padding: '28px 0',
          backgroundColor: '#eae3d9',
          borderTop: '1px solid #ded6c9',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b' }}>
                Clean Beauty That Performs
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b' }}>
                Small Batches Made Fresh
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b' }}>
                Transparent From Start To Finish
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e382b" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e382b' }}>
                Conscious Choices Better Future
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
