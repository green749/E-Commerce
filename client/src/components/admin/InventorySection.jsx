import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { Input, Button, Modal, Price, useToast } from '../ui/index.js';
import { adminApi } from '../../api/admin.js';
import { AdminTable } from './AdminTable.jsx';

export function InventorySection() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stock Adjustment Modal
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('Stock reconciliation cycle count');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getInventory({
        search: search.trim() || undefined,
        low_stock: lowStockOnly ? 'true' : undefined,
        page,
        limit: 15,
      });
      setItems(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalItems(res.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, [search, lowStockOnly, page, toast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openAdjustModal = (item) => {
    setAdjustingItem(item);
    setNewQty(item.quantity_on_hand.toString());
    setReason('Stock reconciliation cycle count');
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (newQty === '' || isNaN(Number(newQty)) || Number(newQty) < 0) {
      toast.error('Enter a valid non-negative quantity', 'Validation Error');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      toast.error('Adjustment reason must be at least 3 characters', 'Audit Requirement');
      return;
    }

    setIsAdjusting(true);
    try {
      await adminApi.adjustInventory(adjustingItem.variant_id, {
        quantity_on_hand: parseInt(newQty, 10),
        reason: reason.trim(),
      });
      toast.success(
        `Updated stock for ${adjustingItem.sku} to ${newQty} units.`,
        'Inventory Adjusted'
      );
      setAdjustingItem(null);
      await fetchInventory();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock', 'Error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const columns = [
    {
      header: 'Product / Variant',
      key: 'product_name',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e382b' }}>{row.product_name}</div>
          <div style={{ fontSize: '11px', color: '#687367' }}>
            {row.brand} • {row.color || 'Standard'} {row.size ? `(${row.size})` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'SKU',
      key: 'sku',
      render: (row) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            fontSize: '11px',
            backgroundColor: '#f3efe9',
            padding: '2px 6px',
            borderRadius: '4px',
            color: '#1e382b',
          }}
        >
          {row.sku}
        </span>
      ),
    },
    {
      header: 'Price',
      key: 'price',
      align: 'right',
      render: (row) => <Price price={row.price} isPaise size="xs" />,
    },
    {
      header: 'On Hand',
      key: 'quantity_on_hand',
      align: 'center',
      render: (row) => <span style={{ fontWeight: 600, color: '#1e382b' }}>{row.quantity_on_hand}</span>,
    },
    {
      header: 'Reserved',
      key: 'quantity_reserved',
      align: 'center',
      render: (row) => (
        <span style={{ color: row.quantity_reserved > 0 ? '#b45309' : '#889387' }}>
          {row.quantity_reserved}
        </span>
      ),
    },
    {
      header: 'Available',
      key: 'available',
      align: 'center',
      render: (row) => {
        const isLow = row.available <= row.reorder_level;
        const isOut = row.available <= 0;
        return (
          <span
            style={{
              fontWeight: 700,
              fontSize: '13px',
              fontFamily: 'var(--font-heading)',
              color: isOut ? '#dc2626' : isLow ? '#b45309' : '#1e382b',
            }}
          >
            {row.available}
          </span>
        );
      },
    },
    {
      header: 'Reorder Level',
      key: 'reorder_level',
      align: 'center',
      render: (row) => <span style={{ color: '#889387' }}>{row.reorder_level}</span>,
    },
    {
      header: 'Status',
      key: 'health',
      render: (row) => {
        const isLow = row.available <= row.reorder_level;
        const isOut = row.available <= 0;
        const badgeBg = isOut ? '#fef2f2' : isLow ? '#fffbeb' : '#eaf4ee';
        const badgeColor = isOut ? '#991b1b' : isLow ? '#92400e' : '#166534';
        const dotColor = isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a';
        const label = isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'HEALTHY';

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: badgeBg,
              color: badgeColor,
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: dotColor,
              }}
            />
            {label}
          </span>
        );
      },
    },
    {
      header: 'Action',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => openAdjustModal(row)}
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '6px',
            border: '1px solid #d4cdc3',
            backgroundColor: '#ffffff',
            color: '#1e382b',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f7f4ef';
            e.currentTarget.style.borderColor = '#1e382b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#d4cdc3';
          }}
        >
          Edit Stock
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Streamlined Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '240px', maxWidth: '480px' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search by SKU or product name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<FiSearch size={14} style={{ color: '#889387' }} />}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setLowStockOnly((prev) => !prev);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer',
              border: lowStockOnly ? '1px solid #b45309' : '1px solid #d4cdc3',
              backgroundColor: lowStockOnly ? '#fef3c7' : '#ffffff',
              color: lowStockOnly ? '#92400e' : '#5e6b5f',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <FiAlertTriangle size={13} style={{ color: lowStockOnly ? '#b45309' : '#889387' }} />
            {lowStockOnly ? 'Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#687367' }}>
          Total: <strong style={{ color: '#1e382b' }}>{totalItems}</strong> variants
        </div>
      </div>

      {/* Inventory Table with Sticky Header, Row Hover, Pagination */}
      <AdminTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        emptyMessage={
          lowStockOnly
            ? 'No variants currently at or below low stock thresholds.'
            : 'No inventory items matching query.'
        }
      />

      {/* Inline Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        title={`Adjust Stock for ${adjustingItem?.sku}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdjustingItem(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAdjustment} isLoading={isAdjusting}>
              Save Stock Adjustment
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--slate)', marginBottom: '8px' }}>
              Product: <strong>{adjustingItem?.product_name}</strong>
              <br />
              Current On Hand: <strong>{adjustingItem?.quantity_on_hand}</strong> | Reserved:{' '}
              <strong>{adjustingItem?.quantity_reserved}</strong>
            </div>
          </div>

          <Input
            label="New Quantity On Hand"
            type="number"
            min="0"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            required
          />

          <div>
            <label style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
              Audit Reason (Mandatory)
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received new shipment PO #108"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default InventorySection;
