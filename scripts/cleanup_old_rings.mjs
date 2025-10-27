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

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Rings to keep (the ones we just synced)
const ringsToKeep = [
  'ring-1', // Vändra–Enge ring
  'ring-2', // Järva-Jaani–Kõmsi ring
  'ring-6', // Aravete–Maardu ring
  'ring-3', // Kose–Haapsalu ring
  'ring-4', // Jõgeva–Viljandi ring
  'ring-5', // Koeru–Vändra ring
];

async function cleanup() {
  console.log('🗑️  Starting cleanup of old rings...\n');
  
  // Get all rings
  const { data: allRings, error: ringsError } = await sb
    .from('Ring')
    .select('id, region, ringDate');
  
  if (ringsError) {
    throw ringsError;
  }
  
  console.log(`📊 Found ${allRings.length} rings in database`);
  
  // Find rings to delete
  const ringsToDelete = allRings.filter(r => !ringsToKeep.includes(r.id));
  
  if (ringsToDelete.length === 0) {
    console.log('✅ No old rings to delete');
    return;
  }
  
  console.log(`\n🗑️  Rings to delete (${ringsToDelete.length}):`);
  ringsToDelete.forEach(r => console.log(`   - ${r.id}: ${r.region} (${r.ringDate})`));
  
  // Delete stops for these rings first
  for (const ring of ringsToDelete) {
    console.log(`\n🗑️  Deleting stops for ring ${ring.id}...`);
    const { error: stopsError } = await sb
      .from('Stop')
      .delete()
      .eq('ringId', ring.id);
    
    if (stopsError) {
      console.error(`❌ Error deleting stops for ${ring.id}:`, stopsError);
    } else {
      console.log(`   ✅ Deleted stops for ${ring.id}`);
    }
  }
  
  // Delete the rings
  for (const ring of ringsToDelete) {
    console.log(`\n🗑️  Deleting ring ${ring.id}...`);
    const { error: ringError } = await sb
      .from('Ring')
      .delete()
      .eq('id', ring.id);
    
    if (ringError) {
      console.error(`❌ Error deleting ring ${ring.id}:`, ringError);
    } else {
      console.log(`   ✅ Deleted ring ${ring.id}`);
    }
  }
  
  console.log('\n✅ Cleanup completed!');
}

cleanup().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

