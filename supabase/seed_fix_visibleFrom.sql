-- Fix visibleFrom column for Ring table
-- This script ensures visibleFrom exists, backfills NULLs, sets default, and makes it NOT NULL

-- Step 1: Add visibleFrom column if it doesn't exist (as nullable first)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ring' AND column_name = 'visibleFrom') THEN
        ALTER TABLE "Ring" ADD COLUMN "visibleFrom" timestamptz;
    END IF;
END $$;

-- Step 2: Backfill NULL values with coalesce(ringDate, now())
UPDATE "Ring" 
SET "visibleFrom" = COALESCE("ringDate", NOW()) 
WHERE "visibleFrom" IS NULL;

-- Step 3: Set default value to now()
ALTER TABLE "Ring" ALTER COLUMN "visibleFrom" SET DEFAULT NOW();

-- Step 4: Make it NOT NULL
ALTER TABLE "Ring" ALTER COLUMN "visibleFrom" SET NOT NULL;

-- Step 5: Update existing ring UPSERTs to include visibleFrom = ringDate
-- This ensures future ring insertions include visibleFrom
UPDATE "Ring" 
SET "visibleFrom" = "ringDate" 
WHERE "visibleFrom" != "ringDate" OR "visibleFrom" IS NULL;
