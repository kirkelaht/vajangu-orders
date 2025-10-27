import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || (!anon && !serviceKey)) {
    throw new Error("Supabase env missing: NEXT_PUBLIC_SUPABASE_URL or keys");
  }
  return createClient(url, serviceKey || anon!, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const sb = getSb();

    // 1) Try views first (if SQL was run)
    let routes: any[] = [];
    let routeDates: any[] = [];

    // Try reading views
    {
      const { data, error } = await sb.from("vw_routes_full").select("*");
      if (!error && data) {
        routes = data;
      }
    }

    // Try reading date mapping view
    {
      const { data, error } = await sb.from("vw_route_dates_map").select("*");
      if (!error && data) {
        routeDates = data;
      }
    }

    // 2) Fallback: Query Ring and Stop tables directly
    if (!routes.length) {
      const [{ data: rings, error: rErr }, { data: stops, error: sErr }] = await Promise.all([
        sb.from("Ring").select("id, region, ringDate, visibleFrom, visibleTo, cutoffAt, status, driver").order('ringDate', { ascending: true }),
        sb.from("Stop").select("id, ringId, name, place, order_index").order("order_index", { ascending: true })
      ]);

      if (rErr) {
        console.error("[routes] Ring error:", rErr);
        throw rErr;
      }
      if (sErr) {
        console.error("[routes] Stop error:", sErr);
        throw sErr;
      }

      // Group stops by ring
      const stopsByRing = new Map<string, any[]>();
      (stops ?? []).forEach(stop => {
        const arr = stopsByRing.get(stop.ringId) ?? [];
        arr.push({
          id: stop.id,
          name: stop.name,
          place: stop.place,
          order_index: stop.order_index
        });
        stopsByRing.set(stop.ringId, arr);
      });

      routes = (rings ?? []).map(ring => ({
        route_id: ring.id,
        region: ring.region,
        ringDate: ring.ringDate,
        visibleFrom: ring.visibleFrom,
        visibleTo: ring.visibleTo,
        cutoffAt: ring.cutoffAt,
        status: ring.status,
        driver: ring.driver,
        stops: (stopsByRing.get(ring.id) ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      }));
    }

    if (!routeDates.length) {
      routeDates = routes.map(r => ({
        route_id: r.route_id,
        region: r.region,
        ringDate: r.ringDate,
        status: r.status,
        driver: r.driver
      }));
    }

    return NextResponse.json({ routes, routeDates });
  } catch (e: any) {
    console.error("[/api/routes] error:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

