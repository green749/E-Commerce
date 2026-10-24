-- Migration Rollback: 006_internal_order_hold.down.sql

DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases;
DROP TABLE IF EXISTS purchases CASCADE;
DROP INDEX IF EXISTS idx_orders_is_held;

ALTER TABLE orders DROP COLUMN IF EXISTS is_held;
ALTER TABLE orders DROP COLUMN IF EXISTS held_at;
ALTER TABLE orders DROP COLUMN IF EXISTS hold_reason;
ALTER TABLE orders DROP COLUMN IF EXISTS previous_status;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending_payment', 'placed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'));
