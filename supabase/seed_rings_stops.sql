-- Ensure Ring table has required columns
DO $$ 
BEGIN
    -- Add missing columns to Ring table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ring' AND column_name = 'id') THEN
        ALTER TABLE "Ring" ADD COLUMN id text PRIMARY KEY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ring' AND column_name = 'ringDate') THEN
        ALTER TABLE "Ring" ADD COLUMN "ringDate" timestamp;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ring' AND column_name = 'region') THEN
        ALTER TABLE "Ring" ADD COLUMN region text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Ring' AND column_name = 'driver') THEN
        ALTER TABLE "Ring" ADD COLUMN driver text;
    END IF;
END $$;

-- Ensure Stop table has required columns
DO $$ 
BEGIN
    -- Add missing columns to Stop table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Stop' AND column_name = 'id') THEN
        ALTER TABLE "Stop" ADD COLUMN id text PRIMARY KEY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Stop' AND column_name = 'ringId') THEN
        ALTER TABLE "Stop" ADD COLUMN "ringId" text NOT NULL REFERENCES "Ring"(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Stop' AND column_name = 'name') THEN
        ALTER TABLE "Stop" ADD COLUMN name text NOT NULL;
    END IF;
    
    -- Add place column as nullable first, then update existing NULLs, then make NOT NULL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Stop' AND column_name = 'place') THEN
        ALTER TABLE "Stop" ADD COLUMN place text;
        -- Update any existing NULL values with a default value
        UPDATE "Stop" SET place = 'Teadmata' WHERE place IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE "Stop" ALTER COLUMN place SET NOT NULL;
    END IF;
    
    -- Add order_index column as nullable first, then update existing NULLs, then make NOT NULL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Stop' AND column_name = 'order_index') THEN
        ALTER TABLE "Stop" ADD COLUMN order_index int;
        -- Update any existing NULL values with a default value
        UPDATE "Stop" SET order_index = 999 WHERE order_index IS NULL;
        -- Now make it NOT NULL
        ALTER TABLE "Stop" ALTER COLUMN order_index SET NOT NULL;
    END IF;
END $$;

-- Handle existing columns that might have NULL values
DO $$
BEGIN
    -- Update any existing NULL place values
    UPDATE "Stop" SET place = 'Teadmata' WHERE place IS NULL;
    
    -- Update any existing NULL order_index values
    UPDATE "Stop" SET order_index = 999 WHERE order_index IS NULL;
    
    -- Ensure NOT NULL constraints are applied
    ALTER TABLE "Stop" ALTER COLUMN place SET NOT NULL;
    ALTER TABLE "Stop" ALTER COLUMN order_index SET NOT NULL;
EXCEPTION
    WHEN OTHERS THEN
        -- If constraints already exist, ignore the error
        NULL;
END $$;

-- UPSERT the rings (IDs are stable so future runs update)
INSERT INTO "Ring"(id, "ringDate", region, driver, "visibleFrom") VALUES
    ('ring-1','2025-11-07 00:00:00','Vändra–Enge ring', NULL, '2025-11-07 00:00:00'),
    ('ring-2','2025-11-12 00:00:00','Järva-Jaani–Kõmsi ring', NULL, '2025-11-12 00:00:00'),
    ('ring-3','2025-11-19 00:00:00','Kose–Haapsalu ring', NULL, '2025-11-19 00:00:00'),
    ('ring-4','2025-11-21 00:00:00','Jõgeva–Viljandi ring', NULL, '2025-11-21 00:00:00'),
    ('ring-5','2025-11-26 00:00:00','Koeru–Vändra ring', NULL, '2025-11-26 00:00:00'),
    ('ring-6','2025-11-14 00:00:00','Aravete–Maardu ring', NULL, '2025-11-14 00:00:00')
ON CONFLICT (id) DO UPDATE SET 
    "ringDate" = EXCLUDED."ringDate", 
    region = EXCLUDED.region,
    driver = EXCLUDED.driver,
    "visibleFrom" = EXCLUDED."visibleFrom";

-- RING 1: 07.11 Vändra–Enge
DELETE FROM "Stop" WHERE "ringId" IN ('ring-1');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-1-01','ring-1','Vändra','Grossi poe parkla',1),
('ring-1-02','ring-1','Tootsi','bussijaama parkla',2),
('ring-1-03','ring-1','Selja','söökla parkla',3),
('ring-1-04','ring-1','Sindi','Coopi poe vastas parklas',4),
('ring-1-05','ring-1','Paikuse','Coopi poe vastas turu parklas',5),
('ring-1-06','ring-1','Pärnu','Port Arturi 2 vastas jõe äärne parkla',6),
('ring-1-07','ring-1','Sauga','Täkupoisi tankla',7),
('ring-1-08','ring-1','Are','vana Meierei parkla',8),
('ring-1-09','ring-1','Pärnu-Jaagupi','turu parkla',9),
('ring-1-10','ring-1','Libatse','maantee ääres poe parkla',10),
('ring-1-11','ring-1','Enge','Olerexi tankla',11);

-- RING 2: 12.11 Järva-Jaani–Kõmsi
DELETE FROM "Stop" WHERE "ringId" IN ('ring-2');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-2-01','ring-2','Järva-Jaani','Coopi poe vastas parklas',1),
('ring-2-02','ring-2','Roosna-Alliku','bussijaama parklas',2),
('ring-2-03','ring-2','Paide','Maksimarketi vastas Olerexi tankla',3),
('ring-2-04','ring-2','Türi','kesklinnas parklas',4),
('ring-2-05','ring-2','Käru','Hepa tankla',5),
('ring-2-06','ring-2','Lelle','Meie poe parkla',6),
('ring-2-07','ring-2','Kehtna','Coop poe parkla',7),
('ring-2-08','ring-2','Rapla','Selveri parkla',8),
('ring-2-09','ring-2','Märjamaa','Maxima parkla',9),
('ring-2-10','ring-2','Laukna','bussipeatus',10),
('ring-2-11','ring-2','Koluvere','Coop poe parkla',11),
('ring-2-12','ring-2','Kullamaa','bussijaama parkla',12),
('ring-2-13','ring-2','Lihula','bussipeatuse taga parklas',13),
('ring-2-14','ring-2','Kõmsi','poe parkla',14);

-- RING 3: 19.11 Kose–Haapsalu
DELETE FROM "Stop" WHERE "ringId" IN ('ring-3');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-3-01','ring-3','Kose','keskuse parkla',1),
('ring-3-02','ring-3','Keila','kiriku parkla',2),
('ring-3-03','ring-3','Vasalemma','Meie poe parkla',3),
('ring-3-04','ring-3','Ämari','—',4),
('ring-3-05','ring-3','Riisipere','Mati pubi parkla',5),
('ring-3-06','ring-3','Turba','Coop poe parkla',6),
('ring-3-07','ring-3','Risti','poe parkla, bussipeatus',7),
('ring-3-08','ring-3','Palivere','Coop poe parkla',8),
('ring-3-09','ring-3','Taebla','bussijaama parkla',9),
('ring-3-10','ring-3','Linnamäe','ristmiku parkla',10),
('ring-3-11','ring-3','Haapsalu','Rannarootsi keskuse parkla',11);

-- RING 4: 21.11 Jõgeva–Viljandi
DELETE FROM "Stop" WHERE "ringId" IN ('ring-4');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-4-01','ring-4','Jõgeva','linna äärne Alexela',1),
('ring-4-02','ring-4','Põltsamaa','Puhu risti Olerexi tankla',2),
('ring-4-03','ring-4','Tartu','Lõunakeskuse Alexela tankla',3),
('ring-4-04','ring-4','Elva','Maksimarketi parkla',4),
('ring-4-05','ring-4','Rõngu','turu parkla',5),
('ring-4-06','ring-4','Tõrva','keskväljaku parkla',6),
('ring-4-07','ring-4','Helme','lossi varemete parkla',7),
('ring-4-08','ring-4','Ala','poe parkla',8),
('ring-4-09','ring-4','Karksi-Nuia','keskuse parkla',9),
('ring-4-10','ring-4','Abja-Paluoja','tervisekeskuse parkla',10),
('ring-4-11','ring-4','Kulla, Halliste, Õisu, Sultsi','bussipeatuses',11),
('ring-4-12','ring-4','Viljandi','Paala Maksimarketi parkla',12);

-- RING 5: 26.11 Koeru–Vändra
DELETE FROM "Stop" WHERE "ringId" IN ('ring-5');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-5-01','ring-5','Koeru','kiriku parkla',1),
('ring-5-02','ring-5','Imavere','Meie poe parkla',2),
('ring-5-03','ring-5','Võhma','bussijaama parkla',3),
('ring-5-04','ring-5','Olustvere','Coop poe parkla',4),
('ring-5-05','ring-5','Suure-Jaani','bussijaama parkla',5),
('ring-5-06','ring-5','Vastemõisa','Rahvamaja parkla',6),
('ring-5-07','ring-5','Savikoti','—',7),
('ring-5-08','ring-5','Kõpu','Terminali parkla',8),
('ring-5-09','ring-5','Kilingi-Nõmme','Coop poe parkla',9),
('ring-5-10','ring-5','Pärnu','Port Arturi 2 vastas jõe äärne parkla',10),
('ring-5-11','ring-5','Selja','söökla parkla',11),
('ring-5-12','ring-5','Vändra','Grossi poe parkla',12);

-- RING 6: 14.11 Aravete–Maardu
DELETE FROM "Stop" WHERE "ringId" IN ('ring-6');
INSERT INTO "Stop"(id, "ringId", name, place, order_index) VALUES
('ring-6-01','ring-6','Aravete','Meie poe parkla',1),
('ring-6-02','ring-6','Jäneda','Coop poe parkla',2),
('ring-6-03','ring-6','Aegviidu','rongijaama parkla',3),
('ring-6-04','ring-6','Anija','mõisa parkla',4),
('ring-6-05','ring-6','Kehra','Circle K automaat tankla',5),
('ring-6-06','ring-6','Raasiku','Coop poe parkla',6),
('ring-6-07','ring-6','Aruküla','rongijaama parkla',7),
('ring-6-08','ring-6','Jüri','Coop poe parkla',8),
('ring-6-09','ring-6','Kiili','Circle K automaat tankla',9),
('ring-6-10','ring-6','Luige','Neste automaat tankla',10),
('ring-6-11','ring-6','Saku','Ehituskeskuse parkla',11),
('ring-6-12','ring-6','Saue','Rimi vastas parklas',12),
('ring-6-13','ring-6','Ääsmäe','Meie poe parkla',13),
('ring-6-14','ring-6','Tondi','Tondi Selveri Neste tanklas',14),
('ring-6-15','ring-6','Lasnamäe','Tähesaju Prisma parklas',15),
('ring-6-16','ring-6','Mähe','Grossi poe parkla',16),
('ring-6-17','ring-6','Muuga','Maxima parkla',17),
('ring-6-18','ring-6','Maardu','Maxima XXL parkla',18);

-- Done.
