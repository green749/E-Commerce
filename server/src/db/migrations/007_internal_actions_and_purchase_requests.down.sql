-- Migration Rollback: 007_internal_actions_and_purchase_requests.down.sql

DROP TRIGGER IF EXISTS trg_purchase_requests_updated_at ON purchase_requests;
DROP TRIGGER IF EXISTS trg_internal_actions_updated_at ON internal_actions;

DROP TABLE IF EXISTS purchase_requests CASCADE;
DROP TABLE IF EXISTS internal_actions CASCADE;
