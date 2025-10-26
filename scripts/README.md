# Scripts Directory

This directory contains utility scripts for managing the Vajangu Orders system.

## Available Scripts

### sync_rings.mjs

Synchronizes ring schedules from JSON files to Supabase database.

#### Usage

```bash
# Sync all schedules from data/schedules/
node scripts/sync_rings.mjs

# Sync a specific schedule file
node scripts/sync_rings.mjs data/schedules/2025-11.json
```

#### Prerequisites

- Node.js with ES module support
- `.env` file with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (recommended) or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### What it does

1. Reads ring schedule data from JSON files
2. Connects to Supabase using service role key
3. Upserts rings (creates or updates based on region + date)
4. Upserts stops for each ring
5. Handles both `Ring` and `rings` table naming conventions
6. Handles both `Stop` and `stops` table naming conventions

#### Schedule File Format

```json
{
  "year": 2025,
  "month": 11,
  "rings": [
    {
      "date": "2025-11-07",
      "region": "Vändra–Enge ring",
      "driver": "Marvi Laht",
      "visibleFrom": "2025-11-01T00:00:00Z",
      "visibleTo": "2025-11-07T23:59:59Z",
      "cutoffAt": "2025-11-06T18:00:00Z",
      "capacityOrders": 50,
      "capacityKg": 1000,
      "status": "OPEN",
      "stops": [
        {
          "name": "Vändra",
          "place": "Grossi poe parkla",
          "orderIndex": 1
        }
      ]
    }
  ]
}
```

## Adding More Schedules

1. Create a new JSON file in `data/schedules/` following the format above
2. Run the sync script to upload it to Supabase
3. The script will automatically detect new files on subsequent runs

## Troubleshooting

### Error: Missing Supabase credentials

Make sure your `.env` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Error: Table does not exist

The script tries both table naming conventions (`Ring` vs `rings`, `Stop` vs `stops`). If you see errors, check your Supabase database schema.

### Error: Ring update failed

The script uses region + date as a unique identifier. If you're updating an existing ring, make sure the region name matches exactly.
