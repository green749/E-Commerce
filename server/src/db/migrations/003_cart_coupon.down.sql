-- Rollback: 003_cart_coupon.down.sql
-- Description: Drops coupon_id column and indexes from carts table

DROP INDEX IF EXISTS idx_carts_user_id;
DROP INDEX IF EXISTS idx_carts_session_id;
ALTER TABLE carts DROP COLUMN IF EXISTS coupon_id;
