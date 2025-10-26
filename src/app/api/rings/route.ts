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
  const client = sb();

  const tries = [
    { table: 'rings', cols: 'id, region, ring_date, visible_from, visible_to, cutoff_at', order: 'ring_date' },
    { table: 'Ring',  cols: 'id, region, "ringDate", "visibleFrom", "visibleTo", "cutoffAt"', order: 'ringDate' },
  ];

  for (const t of tries) {
    const { data, error } = await client.from<any>(t.table).select(t.cols).order(t.order as any, { ascending: true });
    if (error) {
      console.error('[api/rings]', t.table, 'error:', error.message);
      continue;
    }
    if (!Array.isArray(data)) {
      console.error('[api/rings]', t.table, 'non-array payload');
      continue;
    }
    const items = data.map((row:any) => {
      const iso = row.ring_date ?? row.ringDate ?? null;
      const d = iso ? new Date(iso) : null;
      const region = row.region ?? '';
      const label = d ? `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${region}` : region;
      return { id: row.id, region, dateISO: d ? d.toISOString() : null, label };
    });
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: 'rings failed on all table variants' }, { status: 500 });
}
