import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  QuantityStepper,
  Badge,
  Price,
  Rating,
  Skeleton,
  useToast,
  Modal,
  Drawer,
  EmptyState,
  Breadcrumbs,
  Pagination,
} from '../components/ui/index.js';

export function StyleguidePage() {
  const toast = useToast();

  // Interactive component states
  const [stepperValue, setStepperValue] = useState(2);
  const [checkboxState, setCheckboxState] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(3);
  const [selectedVariant, setSelectedVariant] = useState('black');
  const [inputVal, setInputVal] = useState('Alex Vance');

  const colorTokens = [
    {
      name: '--ink',
      hex: '#0F0F1A',
      desc: 'Midnight charcoal, primary text, dark footer',
      textDark: false,
    },
    { name: '--ink-light', hex: '#1E1E2D', desc: 'Dark surface contrast', textDark: false },
    { name: '--paper', hex: '#FFFFFF', desc: 'Pure white canvas', textDark: true, border: true },
    { name: '--cream', hex: '#FAF9F5', desc: 'Warm editorial paper', textDark: true, border: true },
    { name: '--soft', hex: '#F6F4FF', desc: 'Cool soft background', textDark: true, border: true },
    { name: '--terracotta', hex: '#C85A48', desc: 'Warm earthy accent', textDark: false },
    { name: '--copper', hex: '#B85D19', desc: 'Metallic hardware accent', textDark: false },
    { name: '--olive', hex: '#4A5D4E', desc: 'Deep earthy green', textDark: false },
    { name: '--slate', hex: '#475569', desc: 'Technical cool slate', textDark: false },
    { name: '--mist', hex: '#E2E8F0', desc: 'Light boundary mist', textDark: true, border: true },
    { name: '--primary', hex: '#6C2BFF', desc: 'Vivid violet, primary CTA', textDark: false },
    { name: '--primary-hover', hex: '#571CDD', desc: 'Deep violet hover state', textDark: false },
    {
      name: '--primary-light',
      hex: '#ECE5FF',
      desc: 'Tinted violet badge fill',
      textDark: true,
      border: true,
    },
    { name: '--pink', hex: '#FF3D71', desc: 'Hot pink, % OFF discount badge', textDark: false },
    {
      name: '--pink-light',
      hex: '#FFE8EF',
      desc: 'Pink badge background',
      textDark: true,
      border: true,
    },
    { name: '--sun', hex: '#FFC400', desc: 'Rating stars, gold highlight', textDark: true },
    { name: '--success', hex: '#00B87C', desc: 'In-stock, confirmed orders', textDark: false },
    { name: '--warning', hex: '#F59E0B', desc: 'Low stock alerts', textDark: true },
    { name: '--danger', hex: '#EF4444', desc: 'Errors, cancellations', textDark: false },
    { name: '--muted', hex: '#64748B', desc: 'Secondary body text', textDark: false },
    {
      name: '--border',
      hex: '#E2E8F0',
      desc: 'Standard dividers & borders',
      textDark: true,
      border: true,
    },
  ];

  const spacingScale = [
    { token: '--space-4', value: '4px' },
    { token: '--space-8', value: '8px' },
    { token: '--space-16', value: '16px' },
    { token: '--space-24', value: '24px' },
    { token: '--space-32', value: '32px' },
    { token: '--space-48', value: '48px' },
    { token: '--space-64', value: '64px' },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--paper)',
        minHeight: '100vh',
        paddingBottom: 'var(--space-64)',
      }}
    >
      {/* Header Banner - Editorial, No Cards */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--cream)',
          padding: 'var(--space-48) 0',
        }}
      >
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Design System', href: '/styleguide' },
              { label: 'Living Styleguide & Tokens' },
            ]}
          />
          <div style={{ marginTop: 'var(--space-16)' }}>
            <Badge variant="primary" size="md">
              SHOPPE DESIGN SYSTEM
            </Badge>
            <h1
              className="hero-title"
              style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}
            >
              Design Tokens & UI Component Kit
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: 'var(--muted)',
                maxWidth: '780px',
                lineHeight: '28px',
              }}
            >
              Built according to the strict project rules: Sora & Inter typography, curated palette,
              subtle shadows, 4/8/16/24/32/48/64 spacing, and pure editorial layout (no cards for
              layout).
            </p>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--space-48)' }}>
        {/* ================================================================== */}
        {/* SECTION 1: COLOR PALETTE */}
        {/* ================================================================== */}
        <section id="colors" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              01
            </span>
            <h2 className="h2">Color System & Tokens</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)', maxWidth: '720px' }}>
            A curated, high-contrast palette tailored for an audiophile and technical hardware
            brand. Includes ink darks, warm cream paper, vibrant violet primary, and vibrant pink
            for discount % badges.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-16)',
            }}
          >
            {colorTokens.map((c) => (
              <div
                key={c.name}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--paper)',
                }}
              >
                <div
                  style={{
                    height: '72px',
                    backgroundColor: c.hex,
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '8px 12px',
                    borderBottom: c.border ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: c.textDark ? '#0f0f1a' : '#ffffff',
                      textShadow: c.textDark ? 'none' : '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  >
                    {c.hex}
                  </span>
                </div>
                <div style={{ padding: '12px' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--ink)',
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted)',
                      marginTop: '2px',
                      lineHeight: '15px',
                    }}
                  >
                    {c.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 2: TYPOGRAPHY & TYPE SCALE */}
        {/* ================================================================== */}
        <section id="typography" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              02
            </span>
            <h2 className="h2">Typography Scale & Hierarchy</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Pairing <strong>Sora</strong> (bold, architectural display headers) with{' '}
            <strong>Inter</strong> (clean, highly legible technical body copy). Responsive overrides
            dynamically scale down sizes on mobile viewports.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Hero Display • Sora 800 • 52px / 60px</span>
                <span className="text-caption">--fs-hero</span>
              </div>
              <div className="hero-title">Precision Acoustic Hardware.</div>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Heading 1 • Sora 800 • 38px / 46px</span>
                <span className="text-caption">--fs-h1</span>
              </div>
              <h1 className="h1">Curated Mechanical Desk Tools</h1>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Heading 2 • Sora 700 • 28px / 36px</span>
                <span className="text-caption">--fs-h2</span>
              </div>
              <h2 className="h2">Audiophile Planar Magnetic Drivers</h2>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Heading 3 • Sora 700 • 22px / 28px</span>
                <span className="text-caption">--fs-h3</span>
              </div>
              <h3 className="h3">CNC Milled Aluminum Enclosures</h3>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Heading 4 • Sora 600 • 18px / 24px</span>
                <span className="text-caption">--fs-h4</span>
              </div>
              <h4 className="h4">Hot-Swappable PCB with QMK/VIA Programmability</h4>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">Body Text • Inter 400 • 16px / 26px</span>
                <span className="text-caption">--fs-body</span>
              </div>
              <p className="body-text">
                Every switch, keycap, and cable is calibrated for tactile feedback and acoustic
                dampening. Built with an internal gasket mount system and brass weight plates to
                deliver a deep, satisfying sound profile.
              </p>
            </div>

            <div
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-16)',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">
                  Small Text & Meta • Inter 400/500 • 14px / 20px
                </span>
                <span className="text-caption">--fs-small</span>
              </div>
              <div className="text-small">
                Ships in 24 hours with custom braided cable and keycap puller. Free returns within 7
                days of delivery.
              </div>
            </div>

            <div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <span className="text-caption">
                  Caption / Overline • Inter 600 Uppercase • 12px
                </span>
                <span className="text-caption">--fs-caption</span>
              </div>
              <div className="text-caption">SKU: AUDIO-SENN-660S2 • IN STOCK (READY TO SHIP)</div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 3: SPACING SCALE (4/8/16/24/32/48/64) */}
        {/* ================================================================== */}
        <section id="spacing" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              03
            </span>
            <h2 className="h2">Spacing Tokens (4 / 8 / 16 / 24 / 32 / 48 / 64)</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Strict geometric spacing scale governing component padding, gaps, margins, and section
            layouts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
            {spacingScale.map((s) => (
              <div
                key={s.token}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-16)' }}
              >
                <div
                  style={{
                    width: '100px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--slate)',
                  }}
                >
                  {s.token}
                </div>
                <div
                  style={{ width: '60px', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    height: '24px',
                    width: s.value,
                    backgroundColor: 'var(--primary)',
                    borderRadius: 'var(--radius-xs)',
                    opacity: 0.85,
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 4: BUTTONS */}
        {/* ================================================================== */}
        <section id="buttons" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              04
            </span>
            <h2 className="h2">Buttons</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Large, bold action buttons with 12px radii, loading states, and icon slots.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
            {/* Variants */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-8)' }}>
                Variants
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-16)' }}>
                <Button variant="primary">Primary Violet</Button>
                <Button variant="secondary">Secondary Outline</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="outline">Violet Outline</Button>
                <Button variant="danger">Danger Action</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-8)' }}>
                Sizes (sm, md, lg)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-16)',
                }}
              >
                <Button size="sm">Small (32px)</Button>
                <Button size="md">Medium (42px)</Button>
                <Button size="lg">Large Hero (52px)</Button>
              </div>
            </div>

            {/* States: Loading & Disabled */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-8)' }}>
                States (Loading & Disabled)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-16)' }}>
                <Button isLoading>Processing Order</Button>
                <Button disabled>Disabled State</Button>
                <Button
                  variant="primary"
                  leftIcon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  }
                >
                  Add to Cart
                </Button>
                <Button
                  variant="secondary"
                  rightIcon={
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  }
                >
                  Checkout Now
                </Button>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 5: FORM CONTROLS (Input, Select, Checkbox, QuantityStepper) */}
        {/* ================================================================== */}
        <section id="forms" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              05
            </span>
            <h2 className="h2">Form Controls</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Clean, accessible form inputs, custom select menus, accessible checkboxes, and bounded
            quantity steppers.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-24)',
              alignItems: 'start',
            }}
          >
            {/* Input Standard */}
            <Input
              label="Customer Full Name"
              placeholder="e.g. Sarah Connor"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="Full legal name for courier airway bill"
            />

            {/* Input with Icon */}
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              leftIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              }
            />

            {/* Input with Error */}
            <Input
              label="Pincode / Postal Code"
              placeholder="560001"
              defaultValue="ABC"
              error="Please enter a valid 6-digit Indian PIN code"
            />

            {/* Select Component */}
            <Select
              label="Delivery Shipping Speed"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              options={[
                { value: 'black', label: 'Standard Air Shipping (3-5 Days) - ₹99' },
                { value: 'express', label: 'Express Priority Courier (1-2 Days) - ₹199' },
                { value: 'free', label: 'Free Shipping Threshold Applied - ₹0' },
              ]}
              helperText="All shipments insured with tamper-evident seal"
            />

            {/* Checkbox Component */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-16)',
                paddingTop: '8px',
              }}
            >
              <div className="text-caption">Checkboxes</div>
              <Checkbox
                label="Set as default shipping address"
                description="Use this address automatically during checkout"
                checked={checkboxState}
                onChange={(e) => setCheckboxState(e.target.checked)}
              />
              <Checkbox
                label="Subscribe to weekly audiophile newsletter"
                checked={false}
                onChange={() => {}}
              />
              <Checkbox
                label="Terms and Conditions agreement"
                error="You must agree before placing this order"
                checked={false}
                onChange={() => {}}
              />
            </div>

            {/* Quantity Stepper */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-8)' }}>
                Quantity Stepper (Min 1, Max 10)
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-16)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <QuantityStepper
                    value={stepperValue}
                    onChange={setStepperValue}
                    min={1}
                    max={10}
                    size="md"
                  />
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    Medium Size (40px)
                  </div>
                </div>

                <div>
                  <QuantityStepper
                    value={stepperValue}
                    onChange={setStepperValue}
                    min={1}
                    max={10}
                    size="sm"
                  />
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    Small Size (32px)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 6: BADGES, PRICE & RATINGS */}
        {/* ================================================================== */}
        <section id="feedback" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              06
            </span>
            <h2 className="h2">Badges, Prices & Ratings</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            The <strong>Price</strong> component enforces the project requirement: shows selling
            price, struck-through MRP, and a calculated <strong>% off badge in pink</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
            {/* Price Component Demo */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Price Component with MRP and Pink Discount Badge
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Hero Size (Product Page):
                  </span>
                  <Price price={2499900} mrp={3299900} isPaise={true} size="hero" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Large Size (Product Header / Modal):
                  </span>
                  <Price price={1249900} mrp={1599900} isPaise={true} size="lg" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Medium Size (Catalog Grid / Cart Line Item):
                  </span>
                  <Price price={499900} mrp={699900} isPaise={true} size="md" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Small Size (Mini Cart / Wishlist Snippet):
                  </span>
                  <Price price={199900} mrp={249900} isPaise={true} size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--muted)',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    No Discount Price:
                  </span>
                  <Price price={899900} mrp={null} isPaise={true} size="md" />
                </div>
              </div>
            </div>

            {/* Badges Demo */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Status & Promotion Badges
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
                <Badge variant="primary">New Arrival</Badge>
                <Badge variant="pink">35% OFF</Badge>
                <Badge variant="success">In Stock</Badge>
                <Badge variant="warning">Only 2 Left</Badge>
                <Badge variant="danger">Out of Stock</Badge>
                <Badge variant="bestseller">★ Top Seller</Badge>
                <Badge variant="neutral">Mechanical</Badge>
              </div>
            </div>

            {/* Ratings Demo */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Star Ratings
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-32)',
                  flexWrap: 'wrap',
                }}
              >
                <Rating value={4.9} count={428} size="md" />
                <Rating value={4.5} count={86} size="md" />
                <Rating value={3.5} count={12} size="sm" />
                <Rating value={5.0} count={null} size="md" />
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 7: SKELETON LOADERS & TOASTS */}
        {/* ================================================================== */}
        <section id="shimmer" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              07
            </span>
            <h2 className="h2">Skeleton Loaders & Toast Feedback</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Smooth shimmer placeholders for asynchronous loading states, plus reactive non-intrusive
            toast alerts.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-32)',
            }}
          >
            {/* Skeleton Placeholders */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Skeleton Shimmer Simulation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                  <Skeleton variant="circle" width={48} height={48} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton variant="text" width="60%" height="16px" />
                    <Skeleton variant="text" width="40%" height="12px" />
                  </div>
                </div>
                <Skeleton variant="rect" width="100%" height="120px" />
                <Skeleton variant="text" width="90%" height="14px" />
                <Skeleton variant="text" width="75%" height="14px" />
              </div>
            </div>

            {/* Toast Triggers */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Interactive Toast Notifications
              </div>
              <p
                style={{
                  fontSize: 'var(--fs-small)',
                  color: 'var(--muted)',
                  marginBottom: 'var(--space-16)',
                }}
              >
                Click below to trigger fixed floating notifications at the bottom-right:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.success('Keychron Q1 Pro added to your shopping cart.', 'Cart Updated')
                  }
                >
                  Trigger Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.error('Coupon code VIP20 expired on 2026-10-15.', 'Invalid Coupon')
                  }
                >
                  Trigger Error Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.warning(
                      'Only 1 item remaining in stock for this variant.',
                      'Low Stock Alert'
                    )
                  }
                >
                  Trigger Warning Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    toast.info(
                      'Free express shipping applied for orders over ₹999.',
                      'Shipping Bonus'
                    )
                  }
                >
                  Trigger Info Toast
                </Button>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 8: MODAL & DRAWER DIALOGS */}
        {/* ================================================================== */}
        <section id="overlays" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              08
            </span>
            <h2 className="h2">Modal Dialogs & Slide-In Drawers</h2>
          </div>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-24)' }}>
            Accessible dialog windows with backdrop blur, keyboard ESC dismissal, and slide-in
            animations.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-16)', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Launch Centered Modal
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
              Launch Slide-In Drawer
            </Button>
          </div>

          {/* Interactive Modal Preview */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Sennheiser HD 660S2 Quick View"
            footer={
              <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setIsModalOpen(false);
                    toast.success('Added HD 660S2 to Cart');
                  }}
                >
                  Add to Cart • ₹24,999
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
              <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-body)' }}>
                Experience precision acoustic monitoring. Features vented magnet systems and
                ultralight aluminum voice coils delivering sub-bass depth and refined treble
                clarity.
              </p>
              <div
                style={{
                  padding: 'var(--space-16)',
                  backgroundColor: 'var(--soft)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Price price={2499900} mrp={3299900} isPaise={true} size="lg" />
              </div>
            </div>
          </Modal>

          {/* Interactive Drawer Preview */}
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Shopping Cart (2 Items)"
            position="right"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>
                    Keychron Q1 Pro
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Carbon Black / Red Switches
                  </div>
                  <Price price={1599900} mrp={1899900} isPaise={true} size="sm" />
                </div>
                <QuantityStepper value={1} onChange={() => {}} size="sm" />
              </div>
              <Button fullWidth variant="primary" onClick={() => setIsDrawerOpen(false)}>
                Proceed to Checkout • ₹15,999
              </Button>
            </div>
          </Drawer>
        </section>

        <hr className="divider" />

        {/* ================================================================== */}
        {/* SECTION 9: EMPTY STATE, BREADCRUMBS & PAGINATION */}
        {/* ================================================================== */}
        <section id="navigation" style={{ marginBottom: 'var(--space-64)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-16)',
              marginBottom: 'var(--space-16)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              09
            </span>
            <h2 className="h2">Navigation & Empty States</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-32)' }}>
            {/* Breadcrumbs */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Breadcrumbs Component
              </div>
              <div
                style={{
                  padding: 'var(--space-16)',
                  backgroundColor: 'var(--cream)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Breadcrumbs
                  items={[
                    { label: 'Storefront', href: '/' },
                    { label: 'Mechanical Keyboards', href: '/shop?category=mechanical-keyboards' },
                    { label: 'Keychron', href: '/shop?brand=Keychron' },
                    { label: 'Q1 Pro Wireless QMK Custom' },
                  ]}
                />
              </div>
            </div>

            {/* Pagination Component */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                Pagination Component (Active Page: {currentPage} of 8)
              </div>
              <Pagination page={currentPage} totalPages={8} onPageChange={setCurrentPage} />
            </div>

            {/* Empty State Component */}
            <div>
              <div className="text-caption" style={{ marginBottom: 'var(--space-12)' }}>
                EmptyState Component
              </div>
              <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <EmptyState
                  title="Your shopping cart is empty"
                  description="Explore our curated collection of audiophile headphones, custom mechanical keyboards, and desk essentials."
                  actionText="Start Exploring Catalog"
                  actionHref="/shop"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default StyleguidePage;
