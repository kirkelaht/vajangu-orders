/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  console.log('[api/products] handler start');
  const client = sb();
  
  const tries = [
    { table: 'products', cols: 'id, "groupName", name, unit, "priceCents"' },
    { table: 'Product',  cols: 'id, "groupName", name, unit, "priceCents"' },
  ];
  
  for (const t of tries) {
    const { data, error } = await client.from<any>(t.table).select(t.cols);
    if (error) {
      console.error('[api/products]', t.table, 'error:', error.message);
      continue;
    }
    if (!Array.isArray(data)) {
      console.error('[api/products]', t.table, 'non-array payload');
      continue;
    }

    const groups: any = {};
    for (const row of data) {
      const group = row.groupName || row.group_name || 'Unknown';
      if (!groups[group]) groups[group] = [];
      groups[group].push({
        id: row.id,
        name: row.name,
        unit: row.unit,
        price_cents: row.priceCents || row.price_cents,
        price_eur: (row.priceCents || row.price_cents) ? ((row.priceCents || row.price_cents) / 100) : null
      });
    }

    return NextResponse.json(Object.entries(groups).map(([group, products]) => ({ group, products })));
  }
  
  return NextResponse.json({ error: 'products table not found' }, { status: 500 });
}
