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

export async function GET(req: Request) {
  console.log('[api/stops] handler start');
  
  const { searchParams } = new URL(req.url);
  const ringId = searchParams.get('ringId');
  if (!ringId) return NextResponse.json([]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[api/stops] Missing Supabase environment variables');
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 503 });
  }
  
  try {
    const client = sb();

    // Query Supabase Stop table
    const { data, error } = await client
      .from('Stop')
      .select('id, ringId, name, place, order_index')
      .eq('ringId', ringId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[api/stops] error:', error.message);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    if (!Array.isArray(data)) {
      console.error('[api/stops] non-array payload');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 500 });
    }

    const items = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      place: row.place,
      order_index: row.order_index ?? 0,
      label: `${row.name} — ${row.place ?? ''}`.trim(),
    }));

    return NextResponse.json(items);
  } catch (err: any) {
    console.error('[api/stops] exception:', err.message);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}