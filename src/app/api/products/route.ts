/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('[api/products] Missing Supabase environment variables');
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 503 });
  }

  try {
    // Read flat rows from Product
    const res = await fetch(`${url}/rest/v1/Product?select=sku,name,category,groupName,unit,priceCents,active`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[api/products] REST error', res.status, text);
      return NextResponse.json({ error: `Database error: ${text}` }, { status: res.status });
    }

    const rows: any[] = await res.json();

    // Exclude legacy PORK SKUs
    const cleaned = rows.filter((r: any) => !(String(r.sku || '').startsWith('PORK-')));

    // Show only active rows
    const active = cleaned.filter(r => r.active !== false);

    // Group by groupName (fallback category) and log sizes
    const groups: Record<string, any[]> = {};
    for (const r of active) {
      const keyName = r.groupName ?? r.category ?? 'Muu';
      if (!groups[keyName]) groups[keyName] = [];
      groups[keyName].push({
        id: r.sku,
        name: r.name,
        unit: r.unit ?? 'tk',
        price_cents: typeof r.priceCents === 'number' ? r.priceCents : null,
        price_eur: typeof r.priceCents === 'number' ? r.priceCents / 100 : null,
      });
    }

    // Log group sizes
    const dbg: Record<string, number> = {};
    for (const r of active) {
      const k = r.groupName ?? r.category ?? 'Muu';
      dbg[k] = (dbg[k] ?? 0) + 1;
    }
    console.log('[api/products] groups:', dbg);

    // Sort groups with custom order: "Värske sealiha" first, "Hakklihad" second, "Kinkekaart" last, filter out "Kohandatud tooted"
    const out = Object.entries(groups)
      .filter(([group]) => group !== "Kohandatud tooted")
      .sort(([a], [b]) => {
        if (a === "Värske sealiha") return -1;
        if (b === "Värske sealiha") return 1;
        if (a === "Hakklihad") return -1;
        if (b === "Hakklihad") return 1;
        if (a === "Kinkekaart") return 1;
        if (b === "Kinkekaart") return -1;
        return a.localeCompare(b, 'et'); // alphabetical for others
      })
      .map(([group, products]) => ({
        group,
        products: (products as any[]).sort((a,b) => {
          // Custom sorting for Hakklihad: Seahakkliha first
          if (group === "Hakklihad") {
            if (a.name === "Seahakkliha") return -1;
            if (b.name === "Seahakkliha") return 1;
          }
          return String(a.name).localeCompare(String(b.name), 'et');
        }),
      }));

    return NextResponse.json(out);
  } catch (err: any) {
    console.error('[api/products] exception:', err.message);
    return NextResponse.json({ error: `Server error: ${err.message}` }, { status: 500 });
  }
}
