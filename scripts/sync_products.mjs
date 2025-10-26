import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local if it exists
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = await readFile(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#\s=]+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const [,, inputPath = 'data/products/2025-11.json'] = process.argv;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase env vars');

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

(async () => {
  console.log(`📖 Reading products from: ${inputPath}`);
  const cfg = JSON.parse(await readFile(inputPath, 'utf8'));
  const groups = cfg.groups ?? [];
  
  const rows = groups.flatMap(g => g.products.map(p => ({
    sku: p.id,
    groupName: g.group,
    name: p.name,
    unit: p.unit,
    priceCents: p.price_cents ?? null,
    category: g.group, // Use group as category
    uom: p.unit === 'tk' ? 'TK' : 'KG',
    active: true
  })));

  console.log(`📦 Upserting ${rows.length} products...`);
  const { error } = await sb.from('Product').upsert(rows, { onConflict: 'sku' });
  if (error) throw error;
  console.log(`✅ Synced ${rows.length} products from ${inputPath}`);
})().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

