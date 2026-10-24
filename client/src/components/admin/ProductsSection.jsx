import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import { Input, Button, Modal, Select, Checkbox, Price, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { AdminTable } from './AdminTable.jsx';

export function ProductsSection() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Create / Edit Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    brand: '',
    category_id: '',
    description: '',
    base_price: '',
    mrp: '',
    is_active: true,
    image_urls: [''],
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Variant Modal (to add variant to existing product)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    sku: '',
    size: 'Standard',
    color: 'Matte Black',
    price: '',
    mrp: '',
  });
  const [isSavingVariant, setIsSavingVariant] = useState(false);

  // Delete Modal
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getProducts({
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        is_active: activeFilter || undefined,
        page,
        limit: 15,
      });
      setProducts(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [search, categoryFilter, activeFilter, page, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const catRes = await adminApi.getCategories();
        setCategories(Array.isArray(catRes) ? catRes : catRes.items || []);
      } catch {
        // Silently handled
      }
    }
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      brand: '',
      category_id: categories[0]?.id || '',
      description: '',
      base_price: '',
      mrp: '',
      is_active: true,
      image_urls: ['https://picsum.photos/seed/gear/600/600'],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || '',
      slug: p.slug || '',
      brand: p.brand || '',
      category_id: p.category_id || '',
      description: p.description || '',
      base_price: (p.base_price / 100).toString(),
      mrp: (p.mrp / 100).toString(),
      is_active: p.is_active ?? true,
      image_urls: p.image_urls && p.image_urls.length > 0 ? p.image_urls : [''],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (val) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setProductForm((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || !editingProduct ? slug : prev.slug,
    }));
  };

  const handleAddImageUrl = () => {
    setProductForm((prev) => ({
      ...prev,
      image_urls: [...prev.image_urls, ''],
    }));
  };

  const handleImageUrlChange = (index, val) => {
    const updated = [...productForm.image_urls];
    updated[index] = val;
    setProductForm((prev) => ({ ...prev, image_urls: updated }));
  };

  const handleRemoveImageUrl = (index) => {
    setProductForm((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  const validateProductForm = () => {
    const errs = {};
    if (!productForm.name.trim()) errs.name = 'Product name is required';
    if (!productForm.slug.trim()) errs.slug = 'Slug is required';
    if (!productForm.brand.trim()) errs.brand = 'Brand is required';
    if (!productForm.base_price || Number(productForm.base_price) <= 0) {
      errs.base_price = 'Valid price is required';
    }
    if (!productForm.mrp || Number(productForm.mrp) <= 0) {
      errs.mrp = 'Valid MRP is required';
    }
    return errs;
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const errs = validateProductForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        slug: productForm.slug.trim(),
        brand: productForm.brand.trim(),
        category_id: productForm.category_id || null,
        description: productForm.description.trim() || 'Precision crafted audiophile hardware.',
        base_price: Math.round(Number(productForm.base_price) * 100),
        mrp: Math.round(Number(productForm.mrp) * 100),
        is_active: productForm.is_active,
        image_urls: productForm.image_urls.filter((url) => url.trim().length > 0),
      };

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload);
        toast.success(`Updated "${payload.name}" successfully`, 'Product Saved');
      } else {
        await adminApi.createProduct(payload);
        toast.success(`Created "${payload.name}" successfully`, 'Product Created');
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (p) => {
    try {
      await adminApi.updateProduct(p.id, { is_active: !p.is_active });
      toast.success(
        `Product marked as ${!p.is_active ? 'Active' : 'Inactive'}`,
        'Status Updated'
      );
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle product status', 'Error');
    }
  };

  const handleSoftDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteProduct(productToDelete.id);
      toast.success(`"${productToDelete.name}" soft deleted`, 'Product Deleted');
      setProductToDelete(null);
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product', 'Error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Variant to Product
  const openAddVariantModal = (p) => {
    setSelectedProductForVariant(p);
    setVariantForm({
      sku: `${p.brand.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      size: 'Standard',
      color: 'Matte Black',
      price: (p.base_price / 100).toString(),
      mrp: (p.mrp / 100).toString(),
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    if (!variantForm.sku.trim()) {
      toast.error('SKU is required', 'Variant Error');
      return;
    }
    setIsSavingVariant(true);
    try {
      await adminApi.createVariant({
        product_id: selectedProductForVariant.id,
        sku: variantForm.sku.trim().toUpperCase(),
        size: variantForm.size.trim(),
        color: variantForm.color.trim(),
        price: Math.round(Number(variantForm.price) * 100),
        mrp: Math.round(Number(variantForm.mrp) * 100),
      });
      toast.success('New variant added to product catalog', 'Variant Created');
      setIsVariantModalOpen(false);
      await fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to add variant', 'Error');
    } finally {
      setIsSavingVariant(false);
    }
  };

  const columns = [
    {
      header: 'Product',
      key: 'name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={row.image_urls?.[0] || 'https://picsum.photos/seed/thumb/80/80'}
            alt={row.name}
            loading="lazy"
            decoding="async"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-xs)',
              objectFit: 'cover',
              border: '1px solid var(--border-subtle)',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{row.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
              /{row.slug}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Brand',
      key: 'brand',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.brand}</span>,
    },
    {
      header: 'Category',
      key: 'category_name',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#5e6b5f' }}>
          {row.category_name || 'Botanical Skincare'}
        </span>
      ),
    },
    {
      header: 'Price / MRP',
      key: 'base_price',
      render: (row) => (
        <div>
          <Price price={row.base_price} mrp={row.mrp} isPaise size="xs" />
        </div>
      ),
    },
    {
      header: 'Variants',
      key: 'variants_count',
      render: (row) => (
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#5e6b5f' }}>
          {row.variants_count || 0} SKU(s)
        </span>
      ),
    },
    {
      header: 'Available',
      key: 'total_available',
      render: (row) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: '12px',
            color: (row.total_available || 0) <= 0 ? '#dc2626' : '#1e382b',
          }}
        >
          {row.total_available || 0} in stock
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          style={{
            border: `1px solid ${row.is_active ? '#c2e2cc' : '#e5e7eb'}`,
            background: row.is_active ? '#eaf4ee' : '#f3f4f6',
            cursor: 'pointer',
            padding: '3px 8px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            color: row.is_active ? '#1e382b' : '#6b7280',
          }}
          title="Click to toggle active state"
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: row.is_active ? '#22c55e' : '#9ca3af',
            }}
          />
          <span>{row.is_active ? 'Active' : 'Inactive'}</span>
        </button>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => openAddVariantModal(row)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid #d8d2c7',
              backgroundColor: '#ffffff',
              color: '#1e382b',
              cursor: 'pointer',
            }}
          >
            + SKU
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: '1px solid #d8d2c7',
              backgroundColor: '#ffffff',
              color: '#1e382b',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setProductToDelete(row)}
            style={{
              padding: '4px 6px',
              fontSize: '11px',
              fontWeight: 600,
              border: 'none',
              background: 'none',
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            Delete
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '640px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input
              placeholder="Search products by name, slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch size={14} style={{ color: '#889387' }} />}
            />
          </div>
          <div style={{ width: '150px' }}>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.slug, label: c.name })),
              ]}
            />
          </div>
          <div style={{ width: '130px' }}>
            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Status' },
                { value: 'true', label: 'Active Only' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#687367' }}>
            {totalItems} product{totalItems === 1 ? '' : 's'} in catalog
          </span>
          <button
            type="button"
            onClick={openCreateModal}
            style={{
              backgroundColor: '#1e382b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            + Create Product
          </button>
        </div>
      </div>

      {/* Data Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage="No products found matching filters."
      />

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Create New Product'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProduct} isLoading={isSaving}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Product Title"
              value={productForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              placeholder="e.g. Sennheiser HD 660S2"
              required
            />
            <Input
              label="URL Slug"
              value={productForm.slug}
              onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
              error={formErrors.slug}
              placeholder="sennheiser-hd-660s2"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Brand"
              value={productForm.brand}
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              error={formErrors.brand}
              placeholder="e.g. Sennheiser"
              required
            />
            <Select
              label="Primary Category"
              value={productForm.category_id}
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Base Price (₹)"
              type="number"
              value={productForm.base_price}
              onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
              error={formErrors.base_price}
              placeholder="e.g. 24999"
              required
            />
            <Input
              label="MRP Struck-Through (₹)"
              type="number"
              value={productForm.mrp}
              onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
              error={formErrors.mrp}
              placeholder="e.g. 32999"
              required
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Product Description
            </label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-input)',
                border: '1.5px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                marginTop: '4px',
                boxSizing: 'border-box',
              }}
              placeholder="Detailed acoustic characteristics and build specifications..."
            />
          </div>

          {/* Multiple Image URLs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                Product Image URLs ({productForm.image_urls.length})
              </label>
              <Button size="xs" variant="ghost" type="button" onClick={handleAddImageUrl}>
                + Add Image URL
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productForm.image_urls.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={url}
                    onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  />
                  {productForm.image_urls.length > 1 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      type="button"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleRemoveImageUrl(idx)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <Checkbox
              label="Visible and published in storefront"
              checked={productForm.is_active}
              onChange={(checked) => setProductForm({ ...productForm, is_active: checked })}
            />
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        title={`Add SKU Variant to ${selectedProductForVariant?.name}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsVariantModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveVariant} isLoading={isSavingVariant}>
              Save Variant
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveVariant} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="SKU Identifier"
            value={variantForm.sku}
            onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
            placeholder="e.g. AUD-HD660-SLV"
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Size / Spec"
              value={variantForm.size}
              onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
              placeholder="e.g. 300 Ohm / Wireless"
            />
            <Input
              label="Color / Finish"
              value={variantForm.color}
              onChange={(e) => setVariantForm({ ...variantForm, color: e.target.value })}
              placeholder="e.g. Silver / Matte Black"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Variant Price (₹)"
              type="number"
              value={variantForm.price}
              onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
              required
            />
            <Input
              label="Variant MRP (₹)"
              type="number"
              value={variantForm.mrp}
              onChange={(e) => setVariantForm({ ...variantForm, mrp: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Soft Delete Confirmation Modal */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Soft Delete Product"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setProductToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleSoftDelete}
              isLoading={isDeleting}
            >
              Delete Product
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--slate)', lineHeight: '1.5' }}>
          Are you sure you want to soft delete <strong>{productToDelete?.name}</strong>? It will immediately be hidden from the storefront catalog while preserving past order history.
        </p>
      </Modal>
    </div>
  );
}

export default ProductsSection;
