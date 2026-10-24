-- Rollback Migration 005_analytics_readiness.down.sql

DROP VIEW IF EXISTS returns_summary CASCADE;
DROP VIEW IF EXISTS inventory_snapshot CASCADE;
DROP VIEW IF EXISTS order_funnel CASCADE;
DROP VIEW IF EXISTS daily_sales CASCADE;

DROP TABLE IF EXISTS order_items_archive CASCADE;
DROP TABLE IF EXISTS orders_archive CASCADE;
DROP TABLE IF EXISTS events_archive CASCADE;

ALTER TABLE events DROP COLUMN IF EXISTS page_url;
ALTER TABLE events DROP COLUMN IF EXISTS device_type;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'analytics_readonly') THEN
        DROP OWNED BY analytics_readonly;
        DROP ROLE analytics_readonly;
    END IF;
END $$;
