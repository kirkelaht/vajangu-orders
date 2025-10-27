-- Update Stop table to add place field and make fields nullable for November 2025 data

-- Add place column if it doesn't exist and make it NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Stop' AND column_name = 'place') THEN
        ALTER TABLE "Stop" ADD COLUMN place TEXT;
        UPDATE "Stop" SET place = 'Teadmata' WHERE place IS NULL;
        ALTER TABLE "Stop" ALTER COLUMN place SET NOT NULL;
    END IF;

    -- Make meetingPoint nullable
    ALTER TABLE "Stop" ALTER COLUMN "meetingPoint" DROP NOT NULL;
    
    -- Make time fields nullable
    ALTER TABLE "Stop" ALTER COLUMN "timeStart" DROP NOT NULL;
    ALTER TABLE "Stop" ALTER COLUMN "timeEnd" DROP NOT NULL;
    
    -- Rename sortOrder to order_index
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Stop' AND column_name = 'sortOrder') THEN
        ALTER TABLE "Stop" RENAME COLUMN "sortOrder" TO "order_index";
    END IF;
END
$$;

-- Update Ring table to make date fields nullable
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Ring' AND column_name = 'visibleFrom' AND is_nullable = 'NO') THEN
        ALTER TABLE "Ring" ALTER COLUMN "visibleFrom" DROP NOT NULL;
        ALTER TABLE "Ring" ALTER COLUMN "visibleTo" DROP NOT NULL;
        ALTER TABLE "Ring" ALTER COLUMN "cutoffAt" DROP NOT NULL;
    END IF;
END
$$;

