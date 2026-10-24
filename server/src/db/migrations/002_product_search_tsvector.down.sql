-- Rollback: 002_product_search_tsvector.down.sql
-- Description: Reverts full-text search tsvector column and GIN index

DROP INDEX IF EXISTS idx_products_search_vector;
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
DROP FUNCTION IF EXISTS products_search_vector_trigger();
ALTER TABLE products DROP COLUMN IF EXISTS search_vector;
