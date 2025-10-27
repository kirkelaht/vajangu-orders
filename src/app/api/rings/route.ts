/* eslint-disable @typescript-eslint/no-explicit-any */
// production fix: ensure routes are properly deployed
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
  console.log('[api/rings] handler start');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[api/rings] Missing Supabase environment variables');
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }
  
  const client = sb();

  // Query Supabase Ring table with camelCase columns
  const { data, error } = await client
    .from('Ring')
    .select('id, region, ringDate')
    .order('ringDate', { ascending: true });

  if (error) {
    console.error('[api/rings] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!Array.isArray(data)) {
    console.error('[api/rings] non-array payload');
    return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
  }

  const items = data.map((row: any) => {
    const iso = row.ringDate ?? null;
    const d = iso ? new Date(iso) : null;
    const region = row.region ?? '';
    const label = d ? `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${region}` : region;
    return { id: row.id, region, dateISO: d ? d.toISOString() : null, label };
  });

  return NextResponse.json(items);
}
