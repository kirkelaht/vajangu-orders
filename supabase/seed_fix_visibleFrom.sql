-- Fix visible_from column for rings table
-- This script ensures visible_from exists, backfills NULLs, sets default, and makes it NOT NULL

-- Step 1: Add visible_from column if it doesn't exist (as nullable first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rings' AND column_name = 'visible_from') THEN
        ALTER TABLE rings ADD COLUMN visible_from timestamptz;
    END IF;
END $$;

-- Step 2: Backfill NULL values with coalesce(ring_date, now())
UPDATE rings 
SET visible_from = COALESCE(ring_date, NOW()) 
WHERE visible_from IS NULL;

-- Step 3: Set default value to now()
ALTER TABLE rings ALTER COLUMN visible_from SET DEFAULT NOW();

-- Step 4: Make it NOT NULL
ALTER TABLE rings ALTER COLUMN visible_from SET NOT NULL;

-- Step 5: Update existing ring UPSERTs to include visible_from = ring_date
-- This ensures future ring insertions include visible_from
UPDATE rings 
SET visible_from = ring_date 
WHERE visible_from != ring_date OR visible_from IS NULL;
