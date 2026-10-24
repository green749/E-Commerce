import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Modal, Select, Checkbox, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { AdminTable } from './AdminTable.jsx';

export function CouponsSection() {
  const toast = useToast();

  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    min_order_amount: '0',
    max_discount: '',
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usage_limit: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCoupons({
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setCoupons(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load promotional coupons');
    } finally {
      setIsLoading(false);
    }
  }, [search, page, toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'percent',
      value: '',
      min_order_amount: '0',
      max_discount: '',
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usage_limit: '',
      is_active: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.type === 'percent' ? coupon.value.toString() : (coupon.value / 100).toString(),
      min_order_amount: (coupon.min_order_amount / 100).toString(),
      max_discount: coupon.max_discount ? (coupon.max_discount / 100).toString() : '',
      starts_at: new Date(coupon.starts_at).toISOString().split('T')[0],
      ends_at: new Date(coupon.ends_at).toISOString().split('T')[0],
      usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
      is_active: coupon.is_active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.code.trim()) errors.code = 'Coupon code is required';
    if (!formData.value || Number(formData.value) <= 0) {
      errors.value = 'Valid positive value is required';
    } else if (formData.type === 'percent' && Number(formData.value) > 100) {
      errors.value = 'Percentage discount cannot exceed 100%';
    }
    return errors;
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value:
          formData.type === 'percent'
            ? parseInt(formData.value, 10)
            : Math.round(Number(formData.value) * 100),
        min_order_amount: Math.round(Number(formData.min_order_amount || 0) * 100),
        max_discount: formData.max_discount
          ? Math.round(Number(formData.max_discount) * 100)
          : null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at + 'T23:59:59').toISOString(),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit, 10) : null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon.id, payload);
        toast.success(`Coupon ${payload.code} updated`, 'Coupon Saved');
      } else {
        await adminApi.createCoupon(payload);
        toast.success(`Coupon ${payload.code} created`, 'Coupon Created');
      }
      setIsModalOpen(false);
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to save coupon', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDisable = async (coupon) => {
    try {
      await adminApi.updateCoupon(coupon.id, { is_active: !coupon.is_active });
      toast.success(
        `Coupon ${coupon.code} ${!coupon.is_active ? 'enabled' : 'disabled'}`,
        'Status Changed'
      );
      await fetchCoupons();
    } catch (err) {
      toast.error(err.message || 'Failed to update coupon status', 'Error');
    }
  };

  const columns = [
    {
      header: 'Coupon Code',
      key: 'code',
      render: (row) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '12px',
            color: '#1e382b',
            backgroundColor: '#f5f0ea',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid #ded6c9',
            letterSpacing: '0.04em',
          }}
        >
          {row.code}
        </span>
      ),
    },
    {
      header: 'Discount Benefit',
      key: 'value',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#1e382b' }}>
            {row.type === 'percent' ? `${row.value}% OFF` : `₹${row.value / 100}`}
          </span>
          {row.max_discount && (
            <div style={{ fontSize: '11px', color: '#889387', marginTop: '1px' }}>
              Capped at ₹{row.max_discount / 100}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Min. Order',
      key: 'min_order_amount',
      render: (row) => (
        <span style={{ color: row.min_order_amount > 0 ? '#1e382b' : '#889387' }}>
          {row.min_order_amount > 0 ? `₹${row.min_order_amount / 100}` : 'No Minimum'}
        </span>
      ),
    },
    {
      header: 'Usage / Cap',
      key: 'used_count',
      render: (row) => (
        <span style={{ color: '#5e6b5f', fontWeight: 500, fontSize: '12px' }}>
          {row.used_count || 0} / {row.usage_limit ? row.usage_limit : '∞'}
        </span>
      ),
    },
    {
      header: 'Validity Period',
      key: 'ends_at',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#5e6b5f' }}>
          {new Date(row.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(row.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 9px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: row.is_active ? '#eaf4ee' : '#f3f4f6',
            color: row.is_active ? '#1e382b' : '#6b7280',
            border: `1px solid ${row.is_active ? '#c2e2cc' : '#e5e7eb'}`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: row.is_active ? '#22c55e' : '#9ca3af',
            }}
          />
          {row.is_active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid #d8d2c7',
              backgroundColor: '#ffffff',
              color: '#1e382b',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f0ea')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleToggleDisable(row)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              color: row.is_active ? '#dc2626' : '#1e382b',
              cursor: 'pointer',
            }}
          >
            {row.is_active ? 'Disable' : 'Enable'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Simple Neat Action Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <Input
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#687367' }}>
            {totalItems} coupon{totalItems === 1 ? '' : 's'} registered
          </span>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              backgroundColor: '#1e382b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + Create Coupon
          </button>
        </div>
      </div>

      {/* Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No promotional coupons found."
      />

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCoupon} isLoading={isSaving}>
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Promo Code (Uppercase)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              error={formErrors.code}
              placeholder="e.g. VIP20"
              required
            />
            <Select
              label="Discount Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'percent', label: 'Percentage (%)' },
                { value: 'flat', label: 'Flat Cash (₹)' },
              ]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label={formData.type === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              error={formErrors.value}
              placeholder={formData.type === 'percent' ? '15' : '500'}
              required
            />
            <Input
              label="Min Order Amount (₹)"
              type="number"
              value={formData.min_order_amount}
              onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
              placeholder="0 for no minimum"
            />
          </div>

          {formData.type === 'percent' && (
            <Input
              label="Maximum Discount Cap (₹ Optional)"
              type="number"
              value={formData.max_discount}
              onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
              placeholder="e.g. 2000"
              helperText="Upper limit ceiling on total discount allowed"
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Valid From"
              type="date"
              value={formData.starts_at}
              onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
              required
            />
            <Input
              label="Valid Until"
              type="date"
              value={formData.ends_at}
              onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              required
            />
          </div>

          <Input
            label="Usage Limit (Optional)"
            type="number"
            min="1"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            placeholder="e.g. 100 redemptions"
            helperText="Leave empty for unlimited customer redemptions"
          />

          <div style={{ paddingTop: '8px' }}>
            <Checkbox
              label="Coupon is active and redeemable at checkout"
              checked={formData.is_active}
              onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CouponsSection;
