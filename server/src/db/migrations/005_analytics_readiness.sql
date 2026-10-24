-- ============================================================================
-- Migration: 005_analytics_readiness.sql
-- Prepares database schema for external analytics system, read-only user,
-- incremental sync views, and archival tables.
-- ============================================================================

-- 1. Extend Events Table for device type, page URL, and indexed tracking
ALTER TABLE events ADD COLUMN IF NOT EXISTS device_type VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS page_url TEXT;

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON events (device_type);
CREATE INDEX IF NOT EXISTS idx_events_page_url ON events (page_url);

-- 2. Archival Tables for Data Retention Job (Older than 90 days)
CREATE TABLE IF NOT EXISTS events_archive (
    id UUID PRIMARY KEY,
    user_id UUID,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    device_type VARCHAR(50),
    page_url TEXT,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_archive_occurred_at ON events_archive (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_archive_event_type ON events_archive (event_type);

CREATE TABLE IF NOT EXISTS orders_archive (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    user_id UUID,
    status VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    subtotal BIGINT NOT NULL,
    discount BIGINT NOT NULL DEFAULT 0,
    shipping_fee BIGINT NOT NULL DEFAULT 0,
    tax BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL,
    address_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_archive_order_number ON orders_archive (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_archive_created_at ON orders_archive (created_at DESC);

CREATE TABLE IF NOT EXISTS order_items_archive (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    variant_id UUID,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price BIGINT NOT NULL,
    quantity INT NOT NULL,
    line_total BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_items_archive_order_id ON order_items_archive (order_id);

-- 3. SQL Views for Analytics System with updated_at column for incremental sync

-- View 1: daily_sales
CREATE OR REPLACE VIEW daily_sales AS
SELECT
    DATE(o.created_at) AS sale_date,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.id END) AS completed_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) AS cancelled_orders,
    COALESCE(SUM(oi.quantity), 0) AS total_items_sold,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.subtotal ELSE 0 END), 0) AS gross_sales_amount,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.discount ELSE 0 END), 0) AS total_discounts,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.tax ELSE 0 END), 0) AS total_tax,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.shipping_fee ELSE 0 END), 0) AS total_shipping,
    COALESCE(SUM(CASE WHEN o.status NOT IN ('cancelled', 'pending_payment') THEN o.total ELSE 0 END), 0) AS net_sales_amount,
    MAX(o.updated_at) AS updated_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY DATE(o.created_at);

-- View 2: order_funnel
CREATE OR REPLACE VIEW order_funnel AS
SELECT
    DATE(e.occurred_at) AS funnel_date,
    COALESCE(e.device_type, 'unknown') AS device_type,
    COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END) AS page_views,
    COUNT(CASE WHEN e.event_type = 'search' THEN 1 END) AS searches,
    COUNT(CASE WHEN e.event_type = 'product_view' THEN 1 END) AS product_views,
    COUNT(CASE WHEN e.event_type = 'add_to_cart' THEN 1 END) AS add_to_carts,
    COUNT(CASE WHEN e.event_type = 'remove_from_cart' THEN 1 END) AS remove_from_carts,
    COUNT(CASE WHEN e.event_type = 'begin_checkout' THEN 1 END) AS checkout_starts,
    COUNT(CASE WHEN e.event_type = 'purchase' THEN 1 END) AS purchases,
    COUNT(DISTINCT e.session_id) AS unique_sessions,
    COUNT(DISTINCT e.user_id) AS unique_users,
    MAX(e.updated_at) AS updated_at
FROM events e
GROUP BY DATE(e.occurred_at), COALESCE(e.device_type, 'unknown');

-- View 3: inventory_snapshot
CREATE OR REPLACE VIEW inventory_snapshot AS
SELECT
    v.id AS variant_id,
    v.sku,
    p.id AS product_id,
    p.name AS product_name,
    p.brand,
    c.id AS category_id,
    c.name AS category_name,
    v.size,
    v.color,
    v.price,
    v.mrp,
    inv.quantity_on_hand,
    inv.quantity_reserved,
    (inv.quantity_on_hand - inv.quantity_reserved) AS available_quantity,
    inv.reorder_level,
    ((inv.quantity_on_hand - inv.quantity_reserved) <= inv.reorder_level) AS is_low_stock,
    ((inv.quantity_on_hand - inv.quantity_reserved) <= 0) AS is_out_of_stock,
    (inv.quantity_on_hand * v.price) AS inventory_valuation,
    p.is_active AS product_is_active,
    GREATEST(inv.updated_at, v.updated_at, p.updated_at) AS updated_at
FROM inventory inv
JOIN variants v ON v.id = inv.variant_id
JOIN products p ON p.id = v.product_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.deleted_at IS NULL;

-- View 4: returns_summary
CREATE OR REPLACE VIEW returns_summary AS
SELECT
    DATE(r.created_at) AS return_date,
    r.status,
    COUNT(r.id) AS total_requests,
    COALESCE(SUM(r.refund_amount), 0) AS total_refund_amount,
    COUNT(DISTINCT oi.product_name_snapshot) AS distinct_products_returned,
    MAX(r.updated_at) AS updated_at
FROM returns r
LEFT JOIN order_items oi ON oi.id = r.order_item_id
GROUP BY DATE(r.created_at), r.status;

-- 4. Read-Only Analytics User Setup
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analytics_readonly') THEN
        CREATE ROLE analytics_readonly WITH LOGIN PASSWORD 'analytics_read_secret_2026';
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO analytics_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_readonly;
