-- Migration: 006_internal_order_hold.sql
-- Description: Adds hold support to orders, purchases table, and indexes for internal API operations

-- 1. Extend orders table with is_held, held_at, hold_reason, and previous_status
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_held BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS hold_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS previous_status VARCHAR(30);

-- 2. Update CHECK constraint on orders.status to allow 'hold'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending_payment', 'placed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned', 'hold'));

-- 3. Create index on is_held
CREATE INDEX IF NOT EXISTS idx_orders_is_held ON orders (is_held);

-- 4. Create purchases table for internal purchase requests
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_sku ON purchases (sku);
CREATE INDEX IF NOT EXISTS idx_purchases_order_id ON purchases (order_id);

-- 5. Attach updated_at trigger to purchases table
DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases;
CREATE TRIGGER trg_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
