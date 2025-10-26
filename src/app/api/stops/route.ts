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
  const client = sb();
  const { searchParams } = new URL(req.url);
  const ringId = searchParams.get('ringId');
  if (!ringId) return NextResponse.json([]);

  const tries = [
    { table: 'stops', colRing: 'ring_id', cols: 'id, ring_id, name, place, order_index', order: 'order_index' },
    { table: 'Stop',  colRing: 'ringId',  cols: 'id, "ringId", name, place, order_index', order: 'order_index' },
  ];

  for (const t of tries) {
    const { data, error } = await client.from<any>(t.table)
      .select(t.cols)
      .eq(t.colRing as any, ringId)
      .order(t.order as any, { ascending: true });
    if (error) {
      console.error('[api/stops]', t.table, 'error:', error.message);
      continue;
    }
    if (!Array.isArray(data)) {
      console.error('[api/stops]', t.table, 'non-array payload');
      continue;
    }
    const items = data.map((row:any) => ({
      id: row.id,
      name: row.name,
      place: row.place,
      order_index: row.order_index ?? 0,
      label: `${row.name} — ${row.place ?? ''}`.trim(),
    }));
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: 'stops failed on all table variants' }, { status: 500 });
}