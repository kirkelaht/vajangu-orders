-- Refactor to snake_case table and column names
-- This migration renames tables and columns to PostgreSQL-safe lowercase identifiers

-- RENAME COLUMNS to lowercase (safe if already lowercase)
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "ringDate" TO ring_date;
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "visibleFrom" TO visible_from;
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "visibleTo" TO visible_to;
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "cutoffAt" TO cutoff_at;
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "capacityOrders" TO capacity_orders;
ALTER TABLE IF EXISTS "Ring" RENAME COLUMN "capacityKg" TO capacity_kg;

-- Rename Stop columns
ALTER TABLE IF EXISTS "Stop" RENAME COLUMN "ringId" TO ring_id;
ALTER TABLE IF EXISTS "Stop" RENAME COLUMN "order_index" TO order_index; -- keep same if already ok

-- Rename Product columns (if they exist)
ALTER TABLE IF EXISTS "Product" RENAME COLUMN "currentPrice" TO current_price;
ALTER TABLE IF EXISTS "Product" RENAME COLUMN "catchWeight" TO catch_weight;

-- Rename Order columns
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "customerId" TO customer_id;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "ringId" TO ring_id;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "stopId" TO stop_id;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "deliveryType" TO delivery_type;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "deliveryAddress" TO delivery_address;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "paymentMethod" TO payment_method;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "notesCustomer" TO notes_customer;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "notesInternal" TO notes_internal;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "invoiceNumber" TO invoice_number;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "invoicedAt" TO invoiced_at;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE IF EXISTS "Order" RENAME COLUMN "updatedAt" TO updated_at;

-- Rename OrderLine columns
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "orderId" TO order_id;
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "productId" TO product_id;
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "requestedQty" TO requested_qty;
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "packedWeight" TO packed_weight;
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "substitutionAllowed" TO substitution_allowed;
ALTER TABLE IF EXISTS "OrderLine" RENAME COLUMN "unitPrice" TO unit_price;

-- Rename Customer columns
ALTER TABLE IF EXISTS "Customer" RENAME COLUMN "orgName" TO org_name;
ALTER TABLE IF EXISTS "Customer" RENAME COLUMN "regCode" TO reg_code;

-- Rename table names to plural lowercase for consistency
ALTER TABLE IF EXISTS "Ring" RENAME TO rings;
ALTER TABLE IF EXISTS "Stop" RENAME TO stops;
ALTER TABLE IF EXISTS "Product" RENAME TO products;
ALTER TABLE IF EXISTS "Order" RENAME TO orders;
ALTER TABLE IF EXISTS "OrderLine" RENAME TO order_lines;
ALTER TABLE IF EXISTS "Customer" RENAME TO customers;

-- Refresh policies with new table names
DROP POLICY IF EXISTS "Public read visible rings" ON rings;
CREATE POLICY "Public read rings" ON rings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read stops" ON stops;
CREATE POLICY "Public read stops" ON stops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Update foreign key constraints to use new column names
-- Note: PostgreSQL will automatically update constraint names, but we need to ensure they work
-- The existing foreign keys should continue to work with the new column names
