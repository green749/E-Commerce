import React, { useState, useEffect } from 'react';
import { AccountLayout } from '../components/account/AccountLayout.jsx';
import { Input, Button, Checkbox, Skeleton, Modal, useToast } from '../components/ui/index.js';
import { userApi } from '../api/user.js';

export function AddressesPage() {
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation state
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : data.addresses || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      full_name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      is_default: addresses.length === 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData({
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      is_default: addr.is_default || false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Recipient name is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Phone must be at least 10 digits';
    }
    if (!formData.line1.trim()) errors.line1 = 'Address line 1 is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim()) {
      errors.pincode = 'PIN code is required';
    } else if (!/^\d{4,10}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Valid postal PIN code is required';
    }
    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await userApi.updateAddress(editingAddress.id, formData);
        toast.success('Address updated successfully', 'Changes Saved');
      } else {
        await userApi.createAddress(formData);
        toast.success('New delivery destination added', 'Address Saved');
      }
      setIsModalOpen(false);
      await fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Failed to save address', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await userApi.updateAddress(addr.id, { is_default: true });
      toast.success(`${addr.full_name}'s address is now your default destination.`, 'Default Updated');
      await fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Failed to set default address', 'Error');
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    setIsDeleting(true);
    try {
      await userApi.deleteAddress(addressToDelete.id);
      toast.success('Address removed from your address book', 'Address Deleted');
      setAddressToDelete(null);
      await fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete address', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AccountLayout
      title="Saved Addresses"
      subtitle="Manage your primary delivery locations, studio dispatch points, and tax billing addresses."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Account', href: '/account' },
        { label: 'Addresses' },
      ]}
    >
      <div>
        {/* Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-24)' }}>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            + Add New Address
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div style={{ padding: 'var(--space-20)', color: 'var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && addresses.length === 0 && (
          <div style={{ padding: 'var(--space-48) 0', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📍</div>
            <h3 className="h3" style={{ fontSize: '18px', marginBottom: '8px' }}>
              No saved addresses
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '380px', margin: '0 auto 20px' }}>
              Add a delivery address for quicker one-click checkout and automated invoice tax filings.
            </p>
            <Button variant="primary" onClick={openAddModal}>
              + Add Address
            </Button>
          </div>
        )}

        {/* Addresses List (No Cards - Open Editorial Rows) */}
        {!isLoading && !error && addresses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {addresses.map((addr, idx) => (
              <div
                key={addr.id}
                style={{
                  padding: 'var(--space-24) 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderTop: idx === 0 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 'var(--space-16)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                      {addr.full_name}
                    </span>
                    {addr.is_default && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          fontFamily: 'var(--font-heading)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        Default Address
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '14px', lineHeight: '22px', color: 'var(--slate)' }}>
                    {addr.line1}
                    {addr.line2 && <>, {addr.line2}</>}
                    <br />
                    {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                    Phone: {addr.phone}
                  </div>
                </div>

                {/* Actions: Set Default, Edit, Delete (No Cards) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!addr.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetDefault(addr)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(addr)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => setAddressToDelete(addr)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? 'Edit Delivery Destination' : 'Add New Address'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit} isLoading={isSubmitting}>
              {editingAddress ? 'Save Changes' : 'Add Address'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Recipient Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={formErrors.full_name}
              placeholder="e.g. Alex Vance"
              required
            />
            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={formErrors.phone}
              placeholder="+91 9876543210"
              required
            />
          </div>

          <Input
            label="Street Address Line 1"
            value={formData.line1}
            onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
            error={formErrors.line1}
            placeholder="Flat 102, Silver Birch Apts, 80 Feet Road"
            required
          />

          <Input
            label="Address Line 2 (Optional)"
            value={formData.line2}
            onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
            placeholder="Indiranagar 2nd Stage, Near Metro"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              error={formErrors.city}
              placeholder="Bengaluru"
              required
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              error={formErrors.state}
              placeholder="Karnataka"
              required
            />
            <Input
              label="PIN Code"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              error={formErrors.pincode}
              placeholder="560038"
              required
            />
          </div>

          <div style={{ paddingTop: '8px' }}>
            <Checkbox
              label="Set as default shipping address"
              checked={formData.is_default}
              onChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!addressToDelete}
        onClose={() => setAddressToDelete(null)}
        title="Delete Address"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddressToDelete(null)}>
              Keep
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleDeleteAddress}
              isLoading={isDeleting}
            >
              Delete Address
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '1.5' }}>
          Are you sure you want to delete the address for <strong>{addressToDelete?.full_name}</strong> ({addressToDelete?.line1})? This action cannot be undone.
        </p>
      </Modal>
    </AccountLayout>
  );
}

export default AddressesPage;
