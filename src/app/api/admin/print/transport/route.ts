import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ringId = searchParams.get('ringId');
    const date = searchParams.get('date');

    if (!ringId) {
      return NextResponse.json({ ok: false, error: "ringId is required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Fetch ring details
    const { data: ring, error: ringError } = await sb
      .from('Ring')
      .select('*')
      .eq('id', ringId)
      .single();

    if (ringError || !ring) {
      return NextResponse.json({ ok: false, error: "Ring not found" }, { status: 404 });
    }

    // Fetch all orders for this ring
    let ordersQuery = sb
      .from('Order')
      .select('*')
      .eq('ringId', ringId);

    // Optional: filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      ordersQuery = ordersQuery
        .gte('createdAt', startOfDay.toISOString())
        .lte('createdAt', endOfDay.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('[print/transport] Failed to fetch orders:', ordersError);
      return NextResponse.json({ ok: false, error: "Failed to fetch orders" }, { status: 500 });
    }

    // Fetch all stops for this ring, ordered by order_index (ring route order)
    const { data: stops, error: stopsError } = await sb
      .from('Stop')
      .select('*')
      .eq('ringId', ringId)
      .order('order_index', { ascending: true });

    if (stopsError) {
      console.error('[print/transport] Failed to fetch stops:', stopsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch stops" }, { status: 500 });
    }

    // Group orders by stop in ring order
    const stopGroups = await Promise.all(
      (stops || []).map(async (stop: any) => {
        const stopOrders = (orders || []).filter((order: any) => order.stopId === stop.id);

        // Fetch details for each order
        const ordersWithDetails = await Promise.all(
          stopOrders.map(async (order: any) => {
            // Fetch customer
            const { data: customer } = await sb
              .from('Customer')
              .select('*')
              .eq('id', order.customerId)
              .single();

            // Fetch order lines
            const { data: lines } = await sb
              .from('OrderLine')
              .select('*')
              .eq('orderId', order.id);

            // Fetch products for each line
            const linesWithProducts = await Promise.all(
              (lines || []).map(async (line: any) => {
                const { data: product } = await sb
                  .from('Product')
                  .select('*')
                  .eq('sku', line.productSku)
                  .single();

                // Calculate line total
                const qty = line.packedQty || line.requestedQty || 0;
                const price = line.unitPrice || product?.priceCents / 100 || 0;
                const lineTotal = qty * price;

                return {
                  productName: product?.name || 'Unknown Product',
                  qty,
                  uom: line.uom,
                  unitPrice: price,
                  lineTotal
                };
              })
            );

            // Calculate order total
            const orderTotal = linesWithProducts.reduce((sum, line) => sum + line.lineTotal, 0);

            // Format order content as text
            const orderContent = linesWithProducts
              .map(line => `${line.productName} ${line.qty}${line.uom.toLowerCase()}`)
              .join(', ');

            return {
              customerName: customer?.name || 'Unknown Customer',
              customerPhone: customer?.phone || '',
              orderContent,
              orderTotal
            };
          })
        );

        return {
          stopName: stop.name,
          stopPlace: stop.place,
          orders: ordersWithDetails
        };
      })
    );

    // Filter out stops with no orders
    const nonEmptyStops = stopGroups.filter(group => group.orders.length > 0);

    return NextResponse.json({
      ok: true,
      ring: ring,
      stopGroups: nonEmptyStops
    });
  } catch (error) {
    console.error('[print/transport] Exception:', error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

