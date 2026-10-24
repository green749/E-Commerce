import React, { useState, useEffect } from 'react';
import { AccountLayout } from '../components/account/AccountLayout.jsx';
import { Input, Button, useToast } from '../components/ui/index.js';
import { useAuthStore } from '../store/authStore.js';
import { userApi } from '../api/user.js';

export function AccountPage() {
  const toast = useToast();
  const { user, accessToken, setAuth } = useAuthStore();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});

    const errors = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (phone && phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone number must be at least 10 digits';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updated = await userApi.updateProfile({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
      });
      setAuth(updated, accessToken);
      toast.success('Your profile details have been updated.', 'Profile Saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile', 'Update Error');
      if (err.details) {
        setProfileErrors(err.details);
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors = {};
    if (!currentPassword) errors.currentPassword = 'Enter your current password';
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      if (newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters long';
      } else if (!/[A-Z]/.test(newPassword)) {
        errors.newPassword = 'Must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(newPassword)) {
        errors.newPassword = 'Must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(newPassword)) {
        errors.newPassword = 'Must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
        errors.newPassword = 'Must contain at least one special character';
      }
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await userApi.updatePassword({
        currentPassword,
        password: newPassword,
      });
      toast.success('Your password has been changed securely.', 'Password Changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password', 'Security Error');
      if (err.message && err.message.toLowerCase().includes('current password')) {
        setPasswordErrors({ currentPassword: err.message });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AccountLayout
      title="Personal Profile"
      subtitle="Update your contact information, phone, and account security credentials."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Account', href: '/account' }, { label: 'Profile' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-48)' }}>
        {/* Profile Details Section (No Cards) */}
        <div>
          <div style={{ marginBottom: 'var(--space-20)' }}>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '4px' }}>
              Basic Information
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Your verified account credentials and contact details.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={profileErrors.name}
              placeholder="e.g. Alex Vance"
              required
            />

            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed directly for account security."
            />

            <Input
              label="Mobile Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={profileErrors.phone}
              placeholder="+91 9876543210"
              helperText="Used for shipment notifications and courier delivery verification."
            />

            <div style={{ paddingTop: 'var(--space-8)' }}>
              <Button type="submit" variant="primary" isLoading={isUpdatingProfile}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>

        <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

        {/* Change Password Section (No Cards) */}
        <div>
          <div style={{ marginBottom: 'var(--space-20)' }}>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '4px' }}>
              Account Security & Password
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Ensure your account uses a strong password with at least 8 characters, numbers, and symbols.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
            <Input
              label="Current Password"
              type={showCurrentPass ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={passwordErrors.currentPassword}
              placeholder="Enter existing password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowCurrentPass((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showCurrentPass ? 'Hide password' : 'Show password'}
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPass ? '👁️' : '👁️‍🗨️'}
                </button>
              }
            />

            <Input
              label="New Password"
              type={showNewPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={passwordErrors.newPassword}
              placeholder="Enter new strong password"
              helperText="Min. 8 chars with uppercase, lowercase, number, and symbol"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPass((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showNewPass ? 'Hide password' : 'Show password'}
                  aria-label="Toggle new password visibility"
                >
                  {showNewPass ? '👁️' : '👁️‍🗨️'}
                </button>
              }
            />

            <Input
              label="Confirm New Password"
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={passwordErrors.confirmPassword}
              placeholder="Re-enter new password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showConfirmPass ? 'Hide password' : 'Show password'}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPass ? '👁️' : '👁️‍🗨️'}
                </button>
              }
            />

            <div style={{ paddingTop: 'var(--space-8)' }}>
              <Button type="submit" variant="secondary" isLoading={isUpdatingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AccountLayout>
  );
}

export default AccountPage;
