-- Migration: 004_admin_indexes.sql
-- Description: Indexes to accelerate operational admin dashboard queries (summary metrics, customer search/list, low stock, pending returns)

CREATE INDEX IF NOT EXISTS idx_returns_status ON returns (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_payment ON orders (created_at DESC, payment_status);
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users (role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_quantities ON inventory (quantity_on_hand, quantity_reserved, reorder_level);
