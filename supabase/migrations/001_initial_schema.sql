-- Initial schema for Vajangu Perefarm Orders
-- Converted from Prisma schema to PostgreSQL

-- Enable extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE Segment AS ENUM ('RETAIL', 'RESTAURANT', 'WHOLESALE');
CREATE TYPE Channel AS ENUM ('WEB', 'PHONE', 'FACEBOOK', 'EMAIL');
CREATE TYPE UOM AS ENUM ('KG', 'TK');
CREATE TYPE DeliveryType AS ENUM ('STOP', 'HOME');
CREATE TYPE PaymentMethod AS ENUM ('CASH', 'TRANSFER');
CREATE TYPE PaymentStatus AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'CREDIT');
CREATE TYPE OrderStatus AS ENUM ('NEW', 'ACCEPTED', 'FULFILLING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'INVOICED', 'CANCELLED', 'CREDIT');
CREATE TYPE RingStatus AS ENUM ('OPEN', 'LOCKED', 'DONE');

-- Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    "orgName" TEXT,
    "regCode" TEXT,
    vat TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    segment Segment NOT NULL DEFAULT 'RETAIL',
    "consentEmail" BOOLEAN NOT NULL DEFAULT false,
    "consentSms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ring table
CREATE TABLE IF NOT EXISTS "Ring" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "ringDate" TIMESTAMP NOT NULL,
    region TEXT NOT NULL,
    driver TEXT,
    "visibleFrom" TIMESTAMP,
    "visibleTo" TIMESTAMP,
    "cutoffAt" TIMESTAMP,
    "capacityOrders" INTEGER,
    "capacityKg" DECIMAL,
    status RingStatus NOT NULL DEFAULT 'OPEN',
    "place" TEXT,
    "order_index" INTEGER
);

-- Stop table  
CREATE TABLE IF NOT EXISTS "Stop" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "ringId" TEXT NOT NULL REFERENCES "Ring"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    name TEXT NOT NULL,
    place TEXT NOT NULL,
    "meetingPoint" TEXT,
    "timeStart" TIMESTAMP,
    "timeEnd" TIMESTAMP,
    "order_index" INTEGER NOT NULL,
    "sortOrder" INTEGER
);

-- Product table
CREATE TABLE IF NOT EXISTS "Product" (
    sku TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    "groupName" TEXT,
    "group_name" TEXT,
    unit TEXT,
    "priceCents" INTEGER,
    uom UOM NOT NULL,
    "catchWeight" BOOLEAN NOT NULL DEFAULT false,
    "price_cents" INTEGER,
    active BOOLEAN NOT NULL DEFAULT true
);

-- PriceList table
CREATE TABLE IF NOT EXISTS "PriceList" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    segment Segment NOT NULL,
    "validFrom" TIMESTAMP NOT NULL,
    "validTo" TIMESTAMP
);

-- PriceItem table
CREATE TABLE IF NOT EXISTS "PriceItem" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "priceListId" TEXT NOT NULL REFERENCES "PriceList"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "productSku" TEXT NOT NULL REFERENCES "Product"("sku") ON DELETE RESTRICT ON UPDATE CASCADE,
    "unitPrice" DECIMAL NOT NULL
);

-- Order table
CREATE TABLE IF NOT EXISTS "Order" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    channel Channel NOT NULL,
    "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "ringId" TEXT NOT NULL REFERENCES "Ring"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "stopId" TEXT NOT NULL REFERENCES "Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "deliveryType" DeliveryType NOT NULL,
    "deliveryAddress" TEXT,
    status OrderStatus NOT NULL DEFAULT 'NEW',
    "notesCustomer" TEXT,
    "notesInternal" TEXT,
    "paymentMethod" PaymentMethod NOT NULL,
    "paymentStatus" PaymentStatus NOT NULL DEFAULT 'UNPAID',
    "invoiceId" TEXT,
    "invoiceNumber" TEXT UNIQUE,
    "invoicedAt" TIMESTAMP,
    "invoiceTotal" DECIMAL,
    "taxRate" DECIMAL,
    "pickedBy" TEXT,
    "deliveredBy" TEXT
);

-- OrderLine table
CREATE TABLE IF NOT EXISTS "OrderLine" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "productSku" TEXT NOT NULL REFERENCES "Product"("sku") ON DELETE RESTRICT ON UPDATE CASCADE,
    uom UOM NOT NULL,
    "requestedQty" DECIMAL NOT NULL,
    "packedQty" DECIMAL,
    "packedWeight" DECIMAL,
    "unitPrice" DECIMAL,
    "lineTotal" DECIMAL,
    "substitutionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "substitutionSku" TEXT,
    "product_sku" TEXT REFERENCES "Product"("sku") ON DELETE RESTRICT ON UPDATE CASCADE,
    "order_id" TEXT REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "idx_order_created" ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_ring_date" ON "Ring"("ringDate");
CREATE INDEX IF NOT EXISTS "idx_stop_ring" ON "Stop"("ringId");

