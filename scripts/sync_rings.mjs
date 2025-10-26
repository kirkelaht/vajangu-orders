#!/usr/bin/env node

/**
 * Sync Rings to Supabase
 * 
 * This script reads ring schedules from data/schedules/*.json files
 * and syncs them to Supabase database.
 * 
 * Usage:
 *   node scripts/sync_rings.mjs [schedule-file]
 * 
 * Examples:
 *   node scripts/sync_rings.mjs                      # Sync all schedules
 *   node scripts/sync_rings.mjs data/schedules/2025-11.json  # Sync specific file
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { 
  auth: { persistSession: false },
  db: { schema: 'public' }
});

/**
 * Process a single schedule file
 */
async function processSchedule(filePath) {
  console.log(`\n📖 Reading schedule from: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const schedule = JSON.parse(fileContent);
  
  console.log(`📅 Processing ${schedule.rings.length} rings for ${schedule.year}-${String(schedule.month).padStart(2, '0')}`);
  
  for (const ringData of schedule.rings) {
    await syncRing(ringData);
  }
  
  console.log('✅ Schedule processed successfully');
}

/**
 * Sync a single ring to Supabase
 */
async function syncRing(ringData) {
  console.log(`\n🔄 Syncing ring: ${ringData.region} (${ringData.date})`);
  
  // Try both table name formats
  const tableNames = ['Ring', 'rings'];
  
  for (const tableName of tableNames) {
    try {
      // Prepare ring data
      const ringPayload = {
        region: ringData.region,
        ringDate: ringData.date + 'T00:00:00Z',
        driver: ringData.driver || null,
        visibleFrom: ringData.visibleFrom || null,
        visibleTo: ringData.visibleTo || null,
        cutoffAt: ringData.cutoffAt || null,
        capacityOrders: ringData.capacityOrders || null,
        capacityKg: ringData.capacityKg || null,
        status: ringData.status || 'OPEN',
      };
      
      // Try to find existing ring
      let ringId;
      const { data: existingRings, error: findError } = await supabase
        .from(tableName)
        .select('id')
        .eq('region', ringData.region)
        .eq('ringDate', ringData.date + 'T00:00:00Z')
        .limit(1);
      
      if (findError && findError.code !== 'PGRST205') {
        console.error(`  ⚠️  Error finding ring:`, findError.message);
        continue;
      }
      
      // Upsert ring
      if (existingRings && existingRings.length > 0) {
        ringId = existingRings[0].id;
        console.log(`  📝 Updating existing ring: ${ringId}`);
        
        const { error: updateError } = await supabase
          .from(tableName)
          .update(ringPayload)
          .eq('id', ringId);
          
        if (updateError) {
          console.error(`  ❌ Update error:`, updateError.message);
          continue;
        }
      } else {
        ringId = `ring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        ringPayload.id = ringId;
        console.log(`  ➕ Creating new ring: ${ringId}`);
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(ringPayload);
          
        if (insertError) {
          console.error(`  ❌ Insert error:`, insertError.message);
          continue;
        }
      }
      
      // Sync stops
      await syncStops(ringId, ringData.stops);
      
      console.log(`  ✅ Ring synced successfully`);
      break; // Success, exit loop
      
    } catch (error) {
      console.error(`  ⚠️  Error with table ${tableName}:`, error.message);
      continue;
    }
  }
}

/**
 * Sync stops for a ring
 */
async function syncStops(ringId, stops) {
  console.log(`  📍 Syncing ${stops.length} stops...`);
  
  const stopTableNames = ['Stop', 'stops'];
  
  for (const tableName of stopTableNames) {
    try {
      for (const stopData of stops) {
        const stopPayload = {
          ringId,
          name: stopData.name,
          place: stopData.place || '',
          order_index: stopData.orderIndex,
        };
        
        // Try to find existing stop
        const stopId = `${ringId}-${String(stopData.orderIndex).padStart(2, '0')}`;
        
        const { data: existingStops, error: findError } = await supabase
          .from(tableName)
          .select('id')
          .eq('id', stopId)
          .limit(1);
          
        if (findError && findError.code !== 'PGRST205') {
          console.error(`    ⚠️  Error finding stop:`, findError.message);
          continue;
        }
        
        // Upsert stop
        if (existingStops && existingStops.length > 0) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update(stopPayload)
            .eq('id', stopId);
            
          if (updateError) {
            console.error(`    ❌ Stop update error:`, updateError.message);
          }
        } else {
          stopPayload.id = stopId;
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(stopPayload);
            
          if (insertError) {
            console.error(`    ❌ Stop insert error:`, insertError.message);
          }
        }
      }
      
      console.log(`    ✅ ${stops.length} stops synced`);
      break; // Success, exit loop
      
    } catch (error) {
      console.error(`  ⚠️  Error with stop table ${tableName}:`, error.message);
      continue;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting ring sync to Supabase\n');
  
  const scheduleArg = process.argv[2];
  
  if (scheduleArg) {
    // Process single file
    if (!fs.existsSync(scheduleArg)) {
      console.error(`❌ File not found: ${scheduleArg}`);
      process.exit(1);
    }
    await processSchedule(scheduleArg);
  } else {
    // Process all files in data/schedules
    const schedulesDir = path.join(__dirname, '../data/schedules');
    
    if (!fs.existsSync(schedulesDir)) {
      console.error(`❌ Directory not found: ${schedulesDir}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(schedulesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(schedulesDir, file));
    
    if (files.length === 0) {
      console.error('❌ No JSON files found in data/schedules/');
      process.exit(1);
    }
    
    console.log(`Found ${files.length} schedule file(s)\n`);
    
    for (const file of files) {
      await processSchedule(file);
    }
  }
  
  console.log('\n✅ All schedules synced successfully!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
