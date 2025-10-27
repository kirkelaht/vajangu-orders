-- Add missing Product columns
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "groupName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "Product_groupName_idx" ON "Product"("groupName");
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"("active");

