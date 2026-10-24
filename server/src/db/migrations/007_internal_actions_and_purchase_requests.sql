-- Migration: 007_internal_actions_and_purchase_requests.sql
-- Description: Creates internal_actions audit/idempotency table and purchase_requests supplier reorder table

-- 1. Create internal_actions table for idempotency and audit tracking
CREATE TABLE IF NOT EXISTS internal_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    result_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_actions_request_id ON internal_actions (request_id);
CREATE INDEX IF NOT EXISTS idx_internal_actions_action ON internal_actions (action);

-- 2. Create purchase_requests table for supplier reorder requests
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 100000),
    supplier VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    requested_by VARCHAR(255),
    request_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_request_id ON purchase_requests (request_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_sku ON purchase_requests (sku);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_variant_id ON purchase_requests (variant_id);

-- 3. Triggers for updated_at
DROP TRIGGER IF EXISTS trg_internal_actions_updated_at ON internal_actions;
CREATE TRIGGER trg_internal_actions_updated_at
BEFORE UPDATE ON internal_actions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_purchase_requests_updated_at ON purchase_requests;
CREATE TRIGGER trg_purchase_requests_updated_at
BEFORE UPDATE ON purchase_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
