-- Add group_name, unit, and price_cents columns to Product table

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "groupName" TEXT,
ADD COLUMN IF NOT EXISTS "unit" TEXT,
ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;

