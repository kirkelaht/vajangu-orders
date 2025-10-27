import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Query rings (routes)
    const { data: rings, error: ringsErr } = await supabase
      .from("Ring")
      .select("id, region, ringDate, visibleFrom, visibleTo, cutoffAt, status, driver")
      .order('ringDate', { ascending: true });
    
    if (ringsErr) {
      console.error("[routes] Ring error:", ringsErr);
      throw ringsErr;
    }

    // Query all stops
    const { data: stops, error: stopsErr } = await supabase
      .from("Stop")
      .select("id, ringId, name, place, order_index, meetingPoint")
      .order('order_index', { ascending: true });
    
    if (stopsErr) {
      console.error("[routes] Stop error:", stopsErr);
      throw stopsErr;
    }

    // Group stops by ring
    const routesWithStops = rings?.map(ring => ({
      ...ring,
      stops: stops?.filter(stop => stop.ringId === ring.id) || []
    }));

    return NextResponse.json({ routes: routesWithStops });
  } catch (err: any) {
    console.error("[routes] fatal:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

