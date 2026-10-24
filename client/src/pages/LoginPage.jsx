import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Input, Button, useToast } from '../components/ui/index.js';
import { useAuthStore } from '../store/authStore.js';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { login, forgotPassword, resetPassword, isLoading } = useAuthStore();

  // Mode: 'login' | 'forgot' | 'reset'
  const initialMode = searchParams.get('mode') || (location.pathname.includes('reset') ? 'reset' : location.pathname.includes('forgot') ? 'forgot' : 'login');
  const [viewMode, setViewMode] = useState(initialMode);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Reset password fields
  const [resetToken, setResetToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({});

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    document.title = 'Sign In — pure origin Clean Botanical Skincare';
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setViewMode('reset');
    }
  }, [searchParams]);

  // Validation
  const validateLogin = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }
    return errors;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginErrors({});

    const errors = validateLogin();
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }

    try {
      const res = await login({ email: email.trim(), password });
      toast.success('Successfully authenticated', 'Welcome Back');
      // Role-based smart redirection:
      if (res.user?.role === 'admin' && (from === '/' || !from)) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/' ? '/account' : from, { replace: true });
      }
    } catch (err) {
      setLoginErrors({ form: err.message || 'Invalid email or password' });
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Please provide your account email address');
      return;
    }

    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSuccess(true);
      toast.success('Password reset instructions generated', 'Request Sent');
    } catch (err) {
      setForgotError(err.message || 'Failed to process request');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetErrors({});

    const errors = {};
    if (!resetToken.trim()) errors.token = 'Reset token is required';
    if (!newPassword) {
      errors.password = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.password = 'Must include at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      errors.password = 'Must include at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.password = 'Must include at least one number';
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      errors.password = 'Must include at least one special character';
    }

    if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setResetErrors(errors);
      return;
    }

    try {
      await resetPassword({ token: resetToken.trim(), password: newPassword });
      toast.success('Password successfully reset. You may now log in.', 'Password Updated');
      setViewMode('login');
      setEmail(forgotEmail || '');
      setPassword('');
    } catch (err) {
      setResetErrors({ form: err.message || 'Password reset token expired or invalid' });
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoginErrors({});
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
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(180, 83, 42, 0.15) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top: Brand Logo & Return to store link */}
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
            Beauty With
            <br />
            Nothing To Hide.
          </h2>

          <p
            style={{
              fontSize: '15px',
              lineHeight: '24px',
              color: 'rgba(245, 240, 234, 0.85)',
              maxWidth: '440px',
            }}
          >
            Sign in to access your personalized botanical rituals, track eco-deliveries, and manage your clean beauty orders.
          </p>
        </div>

        {/* Middle: Clear distinction between Customer & Administrator */}
        <div style={{ position: 'relative', zIndex: 2, margin: '32px 0' }}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b4532a', marginBottom: '6px' }}>
              ✦ Role Capabilities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <div>
                <strong>Customer:</strong> Manage cart, wishlist, view your personal order invoices & request 30-day returns.
              </div>
              <div>
                <strong>Administrator:</strong> Manage product catalog, warehouse inventory, order fulfillment, RMA refunds & coupons.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(245, 240, 234, 0.75)' }}>
            <span>✓ 100% Recyclable</span>
            <span>✓ Cruelty Free</span>
            <span>✓ 1% For The Planet</span>
          </div>
        </div>

        {/* Footer text */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '11px', color: 'rgba(245, 240, 234, 0.6)' }}>
          © 2026 Pure Origin Clean Skincare. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: Clean Form */}
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
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* ============================================================= */}
          {/* VIEW: LOGIN                                                   */}
          {/* ============================================================= */}
          {viewMode === 'login' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px 0' }}>
                  Welcome Back
                </h1>
                <p style={{ color: '#5e6b5f', fontSize: '14px', margin: 0 }}>
                  Enter your credentials to access your account or operations.
                </p>
              </div>

              {loginErrors.form && (
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
                  {loginErrors.form}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={loginErrors.email}
                  placeholder="alex@example.com"
                  autoComplete="email"
                  required
                />

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={loginErrors.password}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#687367',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    }
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('forgot');
                        setForgotEmail(email);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#b4532a',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <Button fullWidth size="lg" variant="primary" type="submit" isLoading={isLoading} style={{ backgroundColor: '#1e382b' }}>
                    Sign In
                  </Button>
                </div>
              </form>

              {/* Demo Credentials Quick Fill Box - Clear Customer vs Admin Distinction */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#eae3d8',
                  borderRadius: '8px',
                  border: '1px solid #ded6c9',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#1e382b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Quick Test Logins</span>
                  <span style={{ fontSize: '10px', color: '#687367' }}>Click to auto-fill</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('alex@example.com', 'User@123')}
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      background: '#ffffff',
                      border: '1px solid #c8c0b1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#1e382b',
                      textAlign: 'left',
                    }}
                  >
                    <div>👤 Customer Login</div>
                    <div style={{ fontSize: '10px', color: '#687367', fontWeight: 400 }}>Shop & Orders</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@shoppe.com', 'Admin@123')}
                    style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      background: '#1e382b',
                      border: '1px solid #1e382b',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: '#ffffff',
                      textAlign: 'left',
                    }}
                  >
                    <div>👑 Admin Console</div>
                    <div style={{ fontSize: '10px', color: '#eae3d8', fontWeight: 400 }}>Warehouse & Store ops</div>
                  </button>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  fontSize: '13px',
                  color: '#5e6b5f',
                }}
              >
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#b4532a', fontWeight: 700, textDecoration: 'none' }}>
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: FORGOT PASSWORD FLOW SCREEN                             */}
          {/* ============================================================= */}
          {viewMode === 'forgot' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px 0' }}>
                  Reset Password
                </h1>
                <p style={{ color: '#5e6b5f', fontSize: '14px', margin: 0 }}>
                  Enter your email address and we'll send you recovery instructions.
                </p>
              </div>

              {forgotError && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#b91c1c', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                  {forgotError}
                </div>
              )}

              {forgotSuccess ? (
                <div style={{ padding: '20px', backgroundColor: '#eae3d8', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e382b', marginBottom: '8px' }}>
                    Reset link generated!
                  </div>
                  <p style={{ fontSize: '13px', color: '#5e6b5f', margin: '0 0 16px' }}>
                    If an account exists for <strong>{forgotEmail}</strong>, check server logs or inbox for your secure reset token.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewMode('reset');
                      setForgotSuccess(false);
                    }}
                  >
                    I have my reset token
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Input
                    label="Email Address"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    required
                  />

                  <Button fullWidth size="lg" variant="primary" type="submit" isLoading={isLoading} style={{ backgroundColor: '#1e382b' }}>
                    Send Instructions
                  </Button>
                </form>
              )}

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  style={{ background: 'none', border: 'none', color: '#b4532a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* VIEW: RESET PASSWORD FLOW SCREEN                              */}
          {/* ============================================================= */}
          {viewMode === 'reset' && (
            <div>
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', fontWeight: 600, color: '#1e382b', margin: '0 0 8px 0' }}>
                  Create New Password
                </h1>
                <p style={{ color: '#5e6b5f', fontSize: '14px', margin: 0 }}>
                  Enter your reset verification token and choose a new password.
                </p>
              </div>

              {resetErrors.form && (
                <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#b91c1c', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
                  {resetErrors.form}
                </div>
              )}

              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Reset Token"
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  error={resetErrors.token}
                  placeholder="Paste 64-character token"
                  required
                />

                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={resetErrors.password}
                  placeholder="Min 8 chars, 1 uppercase, 1 symbol"
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#687367' }}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  }
                />

                <Input
                  label="Confirm New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={resetErrors.confirm}
                  placeholder="Repeat new password"
                  required
                />

                <Button fullWidth size="lg" variant="primary" type="submit" isLoading={isLoading} style={{ backgroundColor: '#1e382b' }}>
                  Update Password & Sign In
                </Button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  style={{ background: 'none', border: 'none', color: '#b4532a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
