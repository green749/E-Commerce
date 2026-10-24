-- Migration Down: 004_admin_indexes.down.sql

DROP INDEX IF EXISTS idx_inventory_quantities;
DROP INDEX IF EXISTS idx_users_role_created;
DROP INDEX IF EXISTS idx_orders_created_at_payment;
DROP INDEX IF EXISTS idx_returns_status;
