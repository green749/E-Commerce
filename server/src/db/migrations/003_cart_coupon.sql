-- Migration: 003_cart_coupon.sql
-- Description: Adds coupon_id to carts table to track applied discounts on active carts

ALTER TABLE carts ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
