# Supabase Database Setup

## What You Need to Run in Supabase

Since your APIs are working, the tables likely already exist. But you need to verify the schema matches what the code expects.

## Option 1: Check Current Tables

Go to your Supabase dashboard:
1. Navigate to **Table Editor**
2. Check if these tables exist:
   - `Customer`
   - `Ring`
   - `Stop`
   - `Product`
   - `Order`
   - `OrderLine`

## Option 2: Run SQL in Supabase SQL Editor

If tables are missing or incomplete, run this SQL in the Supabase SQL Editor:

```sql
-- Copy and paste the contents of supabase/migrations/001_initial_schema.sql
```

Then run:

```sql
-- Copy and paste the contents of supabase/migrations/002_update_stop_table.sql
```

## What Your Database Should Have

### Critical Tables for Order System:
1. **Ring** - November 2025 delivery routes (6 rows)
2. **Stop** - Delivery stops for each ring
3. **Product** - Product catalog with prices
4. **Customer** - Customer information
5. **Order** - Customer orders
6. **OrderLine** - Individual products in each order

### To Verify Data Exists:

Run this query in Supabase SQL Editor:

```sql
SELECT 
  'Ring' as table_name, COUNT(*) as row_count FROM "Ring"
UNION ALL
SELECT 'Stop', COUNT(*) FROM "Stop"
UNION ALL
SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Customer', COUNT(*) FROM "Customer"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'OrderLine', COUNT(*) FROM "OrderLine";
```

## Current Status

Based on the API responses:
- ✅ Rings table has 6 November 2025 rings
- ✅ Products table has products with prices
- ✅ Database connection working

**You likely don't need to run anything** - your database is already set up!

## Need to Add Data?

If you need to add rings/stops, use:
- `node scripts/sync_rings.mjs data/schedules/2025-11.json`
- `node scripts/sync_products.mjs data/products/2025-11.json`

