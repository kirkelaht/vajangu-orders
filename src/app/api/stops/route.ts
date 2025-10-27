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

  // Mock stops data for November 2025 rings
  const mockStops: Record<string, any[]> = {
    'ring-1': [ // Vändra–Enge
      { id: 'stop-1-1', name: 'Vändra', place: 'Grossi poe parkla', order_index: 1, label: 'Vändra — Grossi poe parkla' },
      { id: 'stop-1-2', name: 'Tootsi', place: 'bussijaama parkla', order_index: 2, label: 'Tootsi — bussijaama parkla' },
      { id: 'stop-1-3', name: 'Selja', place: 'söökla parkla', order_index: 3, label: 'Selja — söökla parkla' },
      { id: 'stop-1-4', name: 'Sindi', place: 'Coopi poe vastas parklas', order_index: 4, label: 'Sindi — Coopi poe vastas parklas' },
      { id: 'stop-1-5', name: 'Paikuse', place: 'Coopi poe vastas turu parklas', order_index: 5, label: 'Paikuse — Coopi poe vastas turu parklas' },
      { id: 'stop-1-6', name: 'Pärnu', place: 'Port Arturi 2 vastas jõe äärne parkla', order_index: 6, label: 'Pärnu — Port Arturi 2 vastas jõe äärne parkla' },
      { id: 'stop-1-7', name: 'Sauga', place: 'Täkupoisi tankla', order_index: 7, label: 'Sauga — Täkupoisi tankla' },
      { id: 'stop-1-8', name: 'Are', place: 'vana Meierei parkla', order_index: 8, label: 'Are — vana Meierei parkla' },
      { id: 'stop-1-9', name: 'Pärnu-Jaagupi', place: 'turu parkla', order_index: 9, label: 'Pärnu-Jaagupi — turu parkla' },
      { id: 'stop-1-10', name: 'Libatse', place: 'maantee ääres poe parkla', order_index: 10, label: 'Libatse — maantee ääres poe parkla' },
      { id: 'stop-1-11', name: 'Enge', place: 'Olerexi tankla', order_index: 11, label: 'Enge — Olerexi tankla' },
    ],
    'ring-2': [ // Järva-Jaani–Kõmsi
      { id: 'stop-2-1', name: 'Järva-Jaani', place: 'Coopi poe vastas parklas', order_index: 1, label: 'Järva-Jaani — Coopi poe vastas parklas' },
      { id: 'stop-2-2', name: 'Roosna-Alliku', place: 'bussijaama parklas', order_index: 2, label: 'Roosna-Alliku — bussijaama parklas' },
      { id: 'stop-2-3', name: 'Paide', place: 'Maksimarketi vastas Olerexi tankla', order_index: 3, label: 'Paide — Maksimarketi vastas Olerexi tankla' },
      { id: 'stop-2-4', name: 'Türi', place: 'kesklinnas parklas', order_index: 4, label: 'Türi — kesklinnas parklas' },
      { id: 'stop-2-5', name: 'Käru', place: 'Hepa tankla', order_index: 5, label: 'Käru — Hepa tankla' },
      { id: 'stop-2-6', name: 'Lelle', place: 'Meie poe parkla', order_index: 6, label: 'Lelle — Meie poe parkla' },
      { id: 'stop-2-7', name: 'Kehtna', place: 'Coop poe parkla', order_index: 7, label: 'Kehtna — Coop poe parkla' },
      { id: 'stop-2-8', name: 'Rapla', place: 'Selveri parkla', order_index: 8, label: 'Rapla — Selveri parkla' },
      { id: 'stop-2-9', name: 'Märjamaa', place: 'Maxima parkla', order_index: 9, label: 'Märjamaa — Maxima parkla' },
      { id: 'stop-2-10', name: 'Laukna', place: 'bussipeatus', order_index: 10, label: 'Laukna — bussipeatus' },
      { id: 'stop-2-11', name: 'Koluvere', place: 'Coop poe parkla', order_index: 11, label: 'Koluvere — Coop poe parkla' },
      { id: 'stop-2-12', name: 'Kullamaa', place: 'bussijaama parkla', order_index: 12, label: 'Kullamaa — bussijaama parkla' },
      { id: 'stop-2-13', name: 'Lihula', place: 'bussipeatuse taga parklas', order_index: 13, label: 'Lihula — bussipeatuse taga parklas' },
      { id: 'stop-2-14', name: 'Kõmsi', place: 'poe parkla', order_index: 14, label: 'Kõmsi — poe parkla' },
    ],
    'ring-3': [ // Aravete–Maardu
      { id: 'stop-3-1', name: 'Aravete', place: 'Meie poe parkla', order_index: 1, label: 'Aravete — Meie poe parkla' },
      { id: 'stop-3-2', name: 'Jäneda', place: 'Coop poe parkla', order_index: 2, label: 'Jäneda — Coop poe parkla' },
      { id: 'stop-3-3', name: 'Aegviidu', place: 'rongijaama parkla', order_index: 3, label: 'Aegviidu — rongijaama parkla' },
      { id: 'stop-3-4', name: 'Anija', place: 'mõisa parkla', order_index: 4, label: 'Anija — mõisa parkla' },
      { id: 'stop-3-5', name: 'Kehra', place: 'Circle K automaat tankla', order_index: 5, label: 'Kehra — Circle K automaat tankla' },
      { id: 'stop-3-6', name: 'Raasiku', place: 'Coop poe parkla', order_index: 6, label: 'Raasiku — Coop poe parkla' },
      { id: 'stop-3-7', name: 'Aruküla', place: 'rongijaama parkla', order_index: 7, label: 'Aruküla — rongijaama parkla' },
      { id: 'stop-3-8', name: 'Jüri', place: 'Coop poe parkla', order_index: 8, label: 'Jüri — Coop poe parkla' },
      { id: 'stop-3-9', name: 'Kiili', place: 'Circle K automaat tankla', order_index: 9, label: 'Kiili — Circle K automaat tankla' },
      { id: 'stop-3-10', name: 'Luige', place: 'Neste automaat tankla', order_index: 10, label: 'Luige — Neste automaat tankla' },
      { id: 'stop-3-11', name: 'Saku', place: 'Ehituskeskuse parkla', order_index: 11, label: 'Saku — Ehituskeskuse parkla' },
      { id: 'stop-3-12', name: 'Saue', place: 'Rimi vastas parklas', order_index: 12, label: 'Saue — Rimi vastas parklas' },
      { id: 'stop-3-13', name: 'Ääsmäe', place: 'Meie poe parkla', order_index: 13, label: 'Ääsmäe — Meie poe parkla' },
      { id: 'stop-3-14', name: 'Tondi', place: 'Tondi Selveri Neste tanklas', order_index: 14, label: 'Tondi — Tondi Selveri Neste tanklas' },
      { id: 'stop-3-15', name: 'Lasnamäe', place: 'Tähesaju Prisma parklas', order_index: 15, label: 'Lasnamäe — Tähesaju Prisma parklas' },
      { id: 'stop-3-16', name: 'Mähe', place: 'Grossi poe parkla', order_index: 16, label: 'Mähe — Grossi poe parkla' },
      { id: 'stop-3-17', name: 'Muuga', place: 'Maxima parkla', order_index: 17, label: 'Muuga — Maxima parkla' },
      { id: 'stop-3-18', name: 'Maardu', place: 'Maxima XXL parkla', order_index: 18, label: 'Maardu — Maxima XXL parkla' },
    ],
    'ring-4': [ // Kose–Haapsalu
      { id: 'stop-4-1', name: 'Kose', place: 'keskuse parkla', order_index: 1, label: 'Kose — keskuse parkla' },
      { id: 'stop-4-2', name: 'Keila', place: 'kiriku parkla', order_index: 2, label: 'Keila — kiriku parkla' },
      { id: 'stop-4-3', name: 'Vasalemma', place: 'Meie poe parkla', order_index: 3, label: 'Vasalemma — Meie poe parkla' },
      { id: 'stop-4-4', name: 'Ämari', place: 'peatus (täpsustamata)', order_index: 4, label: 'Ämari — peatus (täpsustamata)' },
      { id: 'stop-4-5', name: 'Riisipere', place: 'Mati pubi parkla', order_index: 5, label: 'Riisipere — Mati pubi parkla' },
      { id: 'stop-4-6', name: 'Turba', place: 'Coop poe parkla', order_index: 6, label: 'Turba — Coop poe parkla' },
      { id: 'stop-4-7', name: 'Risti', place: 'poe parkla, bussipeatus', order_index: 7, label: 'Risti — poe parkla, bussipeatus' },
      { id: 'stop-4-8', name: 'Palivere', place: 'Coop poe parkla', order_index: 8, label: 'Palivere — Coop poe parkla' },
      { id: 'stop-4-9', name: 'Taebla', place: 'bussijaama parkla', order_index: 9, label: 'Taebla — bussijaama parkla' },
      { id: 'stop-4-10', name: 'Linnamäe', place: 'ristmiku parkla', order_index: 10, label: 'Linnamäe — ristmiku parkla' },
      { id: 'stop-4-11', name: 'Haapsalu', place: 'Rannarootsi keskuse parkla', order_index: 11, label: 'Haapsalu — Rannarootsi keskuse parkla' },
    ],
    'ring-5': [ // Jõgeva–Viljandi
      { id: 'stop-5-1', name: 'Jõgeva', place: 'linna äärne Alexela', order_index: 1, label: 'Jõgeva — linna äärne Alexela' },
      { id: 'stop-5-2', name: 'Põltsamaa', place: 'Puhu risti Olerexi tankla', order_index: 2, label: 'Põltsamaa — Puhu risti Olerexi tankla' },
      { id: 'stop-5-3', name: 'Tartu', place: 'Lõunakeskuse Alexela tankla', order_index: 3, label: 'Tartu — Lõunakeskuse Alexela tankla' },
      { id: 'stop-5-4', name: 'Elva', place: 'Maksimarketi parkla', order_index: 4, label: 'Elva — Maksimarketi parkla' },
      { id: 'stop-5-5', name: 'Rõngu', place: 'turu parkla', order_index: 5, label: 'Rõngu — turu parkla' },
      { id: 'stop-5-6', name: 'Tõrva', place: 'keskväljaku parkla', order_index: 6, label: 'Tõrva — keskväljaku parkla' },
      { id: 'stop-5-7', name: 'Helme', place: 'lossi varemete parkla', order_index: 7, label: 'Helme — lossi varemete parkla' },
      { id: 'stop-5-8', name: 'Ala', place: 'poe parkla', order_index: 8, label: 'Ala — poe parkla' },
      { id: 'stop-5-9', name: 'Karksi-Nuia', place: 'keskuse parkla', order_index: 9, label: 'Karksi-Nuia — keskuse parkla' },
      { id: 'stop-5-10', name: 'Abja-Paluoja', place: 'tervisekeskuse parkla', order_index: 10, label: 'Abja-Paluoja — tervisekeskuse parkla' },
      { id: 'stop-5-11', name: 'Kulla', place: 'bussipeatus', order_index: 11, label: 'Kulla — bussipeatus' },
      { id: 'stop-5-12', name: 'Halliste', place: 'bussipeatus', order_index: 12, label: 'Halliste — bussipeatus' },
      { id: 'stop-5-13', name: 'Õisu', place: 'bussipeatus', order_index: 13, label: 'Õisu — bussipeatus' },
      { id: 'stop-5-14', name: 'Sultsi', place: 'bussipeatus', order_index: 14, label: 'Sultsi — bussipeatus' },
      { id: 'stop-5-15', name: 'Viljandi', place: 'Paala Maksimarketi parkla', order_index: 15, label: 'Viljandi — Paala Maksimarketi parkla' },
    ],
    'ring-6': [ // Koeru–Vändra
      { id: 'stop-6-1', name: 'Koeru', place: 'kiriku parkla', order_index: 1, label: 'Koeru — kiriku parkla' },
      { id: 'stop-6-2', name: 'Imavere', place: 'Meie poe parkla', order_index: 2, label: 'Imavere — Meie poe parkla' },
      { id: 'stop-6-3', name: 'Võhma', place: 'bussijaama parkla', order_index: 3, label: 'Võhma — bussijaama parkla' },
      { id: 'stop-6-4', name: 'Olustvere', place: 'Coop poe parkla', order_index: 4, label: 'Olustvere — Coop poe parkla' },
      { id: 'stop-6-5', name: 'Suure-Jaani', place: 'bussijaama parkla', order_index: 5, label: 'Suure-Jaani — bussijaama parkla' },
      { id: 'stop-6-6', name: 'Vastemõisa', place: 'Rahvamaja parkla', order_index: 6, label: 'Vastemõisa — Rahvamaja parkla' },
      { id: 'stop-6-7', name: 'Savikoti', place: 'peatus (täpsustamata)', order_index: 7, label: 'Savikoti — peatus (täpsustamata)' },
      { id: 'stop-6-8', name: 'Kõpu', place: 'Terminali parkla', order_index: 8, label: 'Kõpu — Terminali parkla' },
      { id: 'stop-6-9', name: 'Kilingi-Nõmme', place: 'Coop poe parkla', order_index: 9, label: 'Kilingi-Nõmme — Coop poe parkla' },
      { id: 'stop-6-10', name: 'Pärnu', place: 'Port Arturi 2 vastas jõe äärne parkla', order_index: 10, label: 'Pärnu — Port Arturi 2 vastas jõe äärne parkla' },
      { id: 'stop-6-11', name: 'Selja', place: 'söökla parkla', order_index: 11, label: 'Selja — söökla parkla' },
      { id: 'stop-6-12', name: 'Vändra', place: 'Grossi poe parkla', order_index: 12, label: 'Vändra — Grossi poe parkla' },
    ],
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[api/stops] Missing Supabase env vars, using mock data for ringId:', ringId);
    return NextResponse.json(mockStops[ringId] ?? []);
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
      // Fallback to mock data
      return NextResponse.json(mockStops[ringId] ?? []);
    }

    if (!Array.isArray(data)) {
      console.error('[api/stops] non-array payload');
      return NextResponse.json(mockStops[ringId] ?? []);
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
    // Return mock data on any error
    return NextResponse.json(mockStops[ringId] ?? []);
  }
}