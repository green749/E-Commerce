import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/events.js';

export function IngredientsPage() {
  useEffect(() => {
    document.title = 'Ingredient Transparency Glossary — pure origin';
    eventsApi.track('page_view', { page: '/ingredients', title: 'Ingredients — pure origin' });
  }, []);

  const [filter, setFilter] = useState('all');

  const ingredients = [
    {
      name: 'Centella Asiatica (Gotu Kola)',
      category: 'soothing',
      benefit: 'Rapidly mitigates inflammation, fortifies weakened skin barriers, and accelerates natural collagen synthesis.',
      source: 'Organic wildcrafted leaf extraction',
    },
    {
      name: 'Cold-Pressed Rosehip Seed Oil',
      category: 'nourishing',
      benefit: 'Rich in provitamin A (trans-retinoic acid) and essential fatty acids (omegas 3, 6, 9) to restore elasticity and fade dark spots.',
      source: 'Patagonian wild rose hips, supercritical CO2 extracted',
    },
    {
      name: 'Sugarcane Botanical Squalane',
      category: 'hydrating',
      benefit: 'Biocompatible lipid that mimics human sebum, delivering deep weightless hydration without clogging pores.',
      source: 'Renewably cultivated, non-GMO sugarcane fermentation',
    },
    {
      name: 'Green Tea Polyphenols (EGCG)',
      category: 'antioxidant',
      benefit: 'High-potency cellular antioxidant that neutralizes UV-induced free radicals and calms skin reactivity.',
      source: 'Shade-grown organic Camellia Sinensis leaves',
    },
    {
      name: 'Tremella Snow Mushroom',
      category: 'hydrating',
      benefit: 'Holds 500x its weight in water with smaller molecular particles than hyaluronic acid, penetrating deeper into the epidermis.',
      source: 'Organic mountain snow fungi harvest',
    },
    {
      name: 'Blue Tansy Essential Oil',
      category: 'soothing',
      benefit: 'High chamazulene content provides the striking deep indigo hue and powerful calming action on irritated skin.',
      source: 'Steam-distilled Moroccan Tanacetum Annuum blossoms',
    },
    {
      name: 'Bakuchiol (Ayurvedic Babchi)',
      category: 'renewing',
      benefit: 'Clinically proven botanical alternative to retinol that improves fine lines and elasticity without redness or sun sensitivity.',
      source: 'Psoralea Corylifolia seeds',
    },
    {
      name: 'Niacinamide (Vitamin B3)',
      category: 'barrier',
      benefit: 'Refines enlarged pore architecture, balances oil flow, and evens out tone across all skin types.',
      source: 'Clean biotechnological synthesis',
    },
  ];

  const filtered = filter === 'all' ? ingredients : ingredients.filter((i) => i.category === filter);

  return (
    <div style={{ backgroundColor: '#fcfaf7', color: '#1e382b', minHeight: '80vh', padding: '60px 0 80px' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#b4532a', display: 'block', marginBottom: '8px' }}>
            FULL DISCLOSURE ALWAYS
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 500, color: '#1e382b', margin: 0 }}>
            Botanical Ingredient Glossary
          </h1>
          <p style={{ fontSize: '15px', color: '#5e6b5f', marginTop: '12px' }}>
            We believe you deserve to know precisely what goes onto your skin. Every single active is harvested at peak vitality and selected for proven cellular bioavailability.
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            {[
              { id: 'all', label: 'All Botanicals' },
              { id: 'soothing', label: 'Soothing & Calming' },
              { id: 'hydrating', label: 'Hydration & Moisture' },
              { id: 'nourishing', label: 'Nourishing Lipids' },
              { id: 'antioxidant', label: 'Antioxidants' },
              { id: 'renewing', label: 'Cellular Renewal' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #c8c0b1',
                  backgroundColor: filter === btn.id ? '#1e382b' : '#ffffff',
                  color: filter === btn.id ? '#ffffff' : '#1e382b',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredients Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {filtered.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #eae3d8',
                padding: '28px',
                boxShadow: '0 4px 14px rgba(30, 56, 43, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#b4532a',
                    backgroundColor: '#faede7',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                >
                  {item.category}
                </span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: '#1e382b', margin: '0 0 10px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#5e6b5f', margin: '0 0 16px' }}>
                  {item.benefit}
                </p>
              </div>

              <div style={{ borderTop: '1px solid #f0e9df', paddingTop: '12px', fontSize: '11px', color: '#687367' }}>
                <strong style={{ color: '#1e382b' }}>Origin: </strong>
                {item.source}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
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
            }}
          >
            Shop Products With These Ingredients →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default IngredientsPage;
