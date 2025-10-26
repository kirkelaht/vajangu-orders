/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const res = await fetch(`${url}/rest/v1/Product?select=sku,name,category,groupName,unit,priceCents,active`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text();
      console.error('[api/products] REST error', res.status, msg);
      return NextResponse.json({ error: msg }, { status: res.status });
    }
    const rows: any[] = await res.json();

    // (TEMP) no filtering — show everything to debug
    // const active = rows.filter(r => r.active !== false);
    const active = rows;

    const groups: Record<string, any[]> = {};
    for (const r of active) {
      const key = r.groupName ?? r.category ?? 'Muu';
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        id: r.sku,
        name: r.name,
        unit: r.unit ?? 'tk',
        price_cents: r.priceCents ?? null,
        price_eur: typeof r.priceCents === 'number' ? r.priceCents / 100 : null,
      });
    }

    const out = Object.entries(groups)
      .sort(([a],[b]) => a.localeCompare(b, 'et'))
      .map(([group, products]) => ({
        group,
        products: (products as any[]).sort((a,b) => String(a.name).localeCompare(String(b.name),'et'))
      }));

    return NextResponse.json(out);
  } catch (e:any) {
    console.error('[api/products] fatal', e?.message);
    return NextResponse.json({ error: e?.message ?? 'fatal' }, { status: 500 });
  }
}
