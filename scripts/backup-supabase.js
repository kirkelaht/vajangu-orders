/**
 * Supabase Backup Script
 * This script creates a backup of your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
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
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Create backups directory
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `supabase-backup-${timestamp}.json`);

(async () => {
  console.log('📦 Starting Supabase backup...\n');

  try {
    // Backup all tables
    const tables = ['Ring', 'Stop', 'Product', 'Customer', 'Order', 'OrderLine'];
    const backup = {};

    for (const table of tables) {
      console.log(`  Backing up ${table}...`);
      const { data, error } = await sb
        .from(table)
        .select('*');
      
      if (error) {
        console.error(`  ❌ Error backing up ${table}:`, error.message);
        backup[table] = [];
      } else {
        console.log(`  ✅ ${table}: ${data?.length || 0} rows`);
        backup[table] = data || [];
      }
    }

    // Save backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    // Get file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ Backup complete!`);
    console.log(`📁 File: ${backupFile}`);
    console.log(`📊 Size: ${fileSizeInMB} MB`);
    console.log(`\n💡 Keep this file safe - it contains all your orders and data!`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
})();

