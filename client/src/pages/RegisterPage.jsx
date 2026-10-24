import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, useToast } from '../components/ui/index.js';
import { useAuthStore } from '../store/authStore.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = 'Create Customer Account — pure origin Clean Botanical Skincare';
  }, []);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (phone.trim() && phone.replace(/\D/g, '').length < 10) {
      errs.phone = 'Phone number must be at least 10 digits';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else {
      if (password.length < 8) {
        errs.password = 'Must be at least 8 characters long';
      } else if (!/[A-Z]/.test(password)) {
        errs.password = 'Must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(password)) {
        errs.password = 'Must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(password)) {
        errs.password = 'Must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        errs.password = 'Must contain at least one special character';
      }
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      toast.success('Your customer account was created successfully!', 'Welcome to Pure Origin');
      navigate('/account', { replace: true });
    } catch (err) {
      setErrors({ form: err.message || 'Registration failed. Email may already be registered.' });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(360px, 1fr)',
        backgroundColor: '#fcfaf7',
      }}
      className="split-auth-container"
    >
      {/* LEFT PANEL: Pure Origin Botanical Editorial Panel */}
      <div
        className="auth-gradient-panel"
        style={{
          background: 'linear-gradient(145deg, #162a20 0%, #1e382b 50%, #2b4f3d 100%)',
          padding: '48px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180, 83, 42, 0.15) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Branding & Return Link */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: '#ffffff',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="#889e8a" strokeWidth="1.8">
                <path d="M14 26V13" />
                <path d="M14 13C10 9 6 10 5 14c0 5 5 7 9 9" />
                <path d="M14 13C18 9 22 10 23 14c0 5-5 7-9 9" />
                <path d="M14 8c-2-3-5-4-7-3 0 3 2 5 7 6" />
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '24px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                pure origin
              </span>
            </Link>

            <Link
              to="/"
              style={{
                color: '#eae3d8',
                fontSize: '12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.85,
              }}
            >
              ← Back to Shop
            </Link>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 3.8vw, 46px)',
              fontWeight: 500,
              lineHeight: '1.1',
              color: '#ffffff',
              marginBottom: '16px',
            }}
          >
            Join The Clean
            <br />
            Beauty Circle.
          </h2>

          <p
            style={{
              fontSize: '15px',
              lineHeight: '24px',
              color: 'rgba(245, 240, 234, 0.85)',
              maxWidth: '440px',
            }}
          >
            Create an account to track deliveries in real time, curate your personal botanical rituals, and save delivery addresses.
          </p>
        </div>

        {/* Feature Highlights */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            margin: '32px 0',
            padding: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b4532a', marginBottom: '10px' }}>
            ✦ Member Privileges
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '22px', color: 'rgba(255, 255, 255, 0.9)' }}>
            <li>Free carbon-neutral shipping on orders over ₹500</li>
            <li>30-day clean beauty guarantee on all formulas</li>
            <li>Priority access to fresh small-batch seasonal releases</li>
            <li>Save favorite routines and printable invoice history</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '11px', color: 'rgba(245, 240, 234, 0.6)' }}>
          By creating an account, you agree to our Terms of Service & Privacy Policy.
        </div>
      </div>

      {/* RIGHT PANEL: Clean Registration Form */}
      <div
        style={{
          padding: '48px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fcfaf7',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px 0' }}>
              Create Account
            </h1>
            <p style={{ color: '#5e6b5f', fontSize: '14px', margin: 0 }}>
              Fill in your details below to activate your customer membership.
            </p>
          </div>

          {errors.form && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#b91c1c',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '20px',
                fontWeight: 500,
              }}
            >
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Sarah Mitchell"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="sarah@example.com"
              autoComplete="email"
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="Min 8 chars, 1 uppercase, 1 symbol"
              autoComplete="new-password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687367' }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687367' }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              }
            />

            <div style={{ paddingTop: '8px' }}>
              <Button fullWidth size="lg" variant="primary" type="submit" isLoading={isLoading} style={{ backgroundColor: '#1e382b' }}>
                Create Customer Account
              </Button>
            </div>
          </form>

          <div
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '13px',
              color: '#5e6b5f',
            }}
          >
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#b4532a', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
