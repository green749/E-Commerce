-- Migration: 002_product_search_tsvector.sql
-- Description: Adds PostgreSQL full-text search tsvector column, GIN index, and trigger to products table

-- 1. Add search_vector column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create trigger function to keep search_vector updated with weighted attributes
CREATE OR REPLACE FUNCTION products_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger on products
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE OF name, brand, description
ON products
FOR EACH ROW
EXECUTE FUNCTION products_search_vector_trigger();

-- 4. Populate search_vector for existing products
UPDATE products
SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
WHERE search_vector IS NULL;

-- 5. Create GIN index on search_vector
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);
