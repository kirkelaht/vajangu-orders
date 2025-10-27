import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = await fs.promises.readFile(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing Supabase env vars');
}

console.log('📝 Please run this SQL in your Supabase SQL Editor:');
console.log(`
-- Add missing columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "groupName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "priceCents" INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Product_groupName_idx" ON "Product"("groupName");
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"("active");
`);

console.log('\n✅ After running the SQL, sync products with:');
console.log('   node scripts/sync_products.mjs data/products/2025-11.json');

