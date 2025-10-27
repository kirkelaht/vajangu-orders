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
    console.warn('[api/rings] Missing Supabase environment variables, using mock data');
    // Return mock November 2025 rings
    const mockRings = [
      { id: 'ring-1', region: 'Vändra–Enge ring', ringDate: '2025-11-07', label: '07.11 Vändra–Enge ring' },
      { id: 'ring-2', region: 'Järva-Jaani–Kõmsi ring', ringDate: '2025-11-12', label: '12.11 Järva-Jaani–Kõmsi ring' },
      { id: 'ring-3', region: 'Aravete–Maardu ring', ringDate: '2025-11-14', label: '14.11 Aravete–Maardu ring' },
      { id: 'ring-4', region: 'Kose–Haapsalu ring', ringDate: '2025-11-19', label: '19.11 Kose–Haapsalu ring' },
      { id: 'ring-5', region: 'Jõgeva–Viljandi ring', ringDate: '2025-11-21', label: '21.11 Jõgeva–Viljandi ring' },
      { id: 'ring-6', region: 'Koeru–Vändra ring', ringDate: '2025-11-26', label: '26.11 Koeru–Vändra ring' },
    ];
    return NextResponse.json(mockRings.map(r => ({
      id: r.id,
      region: r.region,
      dateISO: new Date(r.ringDate).toISOString(),
      label: r.label
    })));
  }
  
  try {
    const client = sb();

    // Query Supabase Ring table with camelCase columns
    const { data, error } = await client
      .from('Ring')
      .select('id, region, ringDate')
      .order('ringDate', { ascending: true });

    if (error) {
      console.error('[api/rings] error:', error.message);
      // Fallback to mock data
      const mockRings = [
        { id: 'ring-1', region: 'Vändra–Enge ring', ringDate: '2025-11-07', label: '07.11 Vändra–Enge ring' },
        { id: 'ring-2', region: 'Järva-Jaani–Kõmsi ring', ringDate: '2025-11-12', label: '12.11 Järva-Jaani–Kõmsi ring' },
        { id: 'ring-3', region: 'Aravete–Maardu ring', ringDate: '2025-11-14', label: '14.11 Aravete–Maardu ring' },
        { id: 'ring-4', region: 'Kose–Haapsalu ring', ringDate: '2025-11-19', label: '19.11 Kose–Haapsalu ring' },
        { id: 'ring-5', region: 'Jõgeva–Viljandi ring', ringDate: '2025-11-21', label: '21.11 Jõgeva–Viljandi ring' },
        { id: 'ring-6', region: 'Koeru–Vändra ring', ringDate: '2025-11-26', label: '26.11 Koeru–Vändra ring' },
      ];
      return NextResponse.json(mockRings.map(r => ({
        id: r.id,
        region: r.region,
        dateISO: new Date(r.ringDate).toISOString(),
        label: r.label
      })));
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
  } catch (err: any) {
    console.error('[api/rings] exception:', err.message);
    // Return mock data on any error
    const mockRings = [
      { id: 'ring-1', region: 'Vändra–Enge ring', ringDate: '2025-11-07', label: '07.11 Vändra–Enge ring' },
      { id: 'ring-2', region: 'Järva-Jaani–Kõmsi ring', ringDate: '2025-11-12', label: '12.11 Järva-Jaani–Kõmsi ring' },
      { id: 'ring-3', region: 'Aravete–Maardu ring', ringDate: '2025-11-14', label: '14.11 Aravete–Maardu ring' },
      { id: 'ring-4', region: 'Kose–Haapsalu ring', ringDate: '2025-11-19', label: '19.11 Kose–Haapsalu ring' },
      { id: 'ring-5', region: 'Jõgeva–Viljandi ring', ringDate: '2025-11-21', label: '21.11 Jõgeva–Viljandi ring' },
      { id: 'ring-6', region: 'Koeru–Vändra ring', ringDate: '2025-11-26', label: '26.11 Koeru–Vändra ring' },
    ];
    return NextResponse.json(mockRings.map(r => ({
      id: r.id,
      region: r.region,
      dateISO: new Date(r.ringDate).toISOString(),
      label: r.label
    })));
  }
}
