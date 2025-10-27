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

export async function GET() {
  try {
    const sb = getSupabase();
    
    // Fetch all orders with related data
    const { data: orders, error } = await sb
      .from('Order')
      .select(`
        *,
        Customer:customer_id (*),
        Ring:ring_id (*),
        Stop:stop_id (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/orders] Failed to fetch orders:', error);
      return NextResponse.json({ ok: false, error: "Failed to fetch orders" }, { status: 500 });
    }

    // Fetch order lines for each order
    const ordersWithLines = await Promise.all(
      (orders || []).map(async (order: any) => {
        const { data: lines } = await sb
          .from('OrderLine')
          .select(`
            *,
            Product:product_sku (*)
          `)
          .eq('order_id', order.id);
        
        return {
          ...order,
          lines: lines || []
        };
      })
    );

    return NextResponse.json({ ok: true, orders: ordersWithLines });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ ok: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, productName, unitPrice, weight, uom } = body;

    if (!orderId || !productName || !unitPrice || !weight) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const sb = getSupabase();

    const customSku = `CUSTOM_${Date.now()}`;

    // Create a custom product entry first
    const { error: productError } = await sb
      .from('Product')
      .upsert({
        sku: customSku,
        name: productName,
        category: 'Kohandatud tooted',
        group_name: 'Kohandatud tooted',
        uom: uom.toUpperCase(),
        active: true,
        catch_weight: uom.toLowerCase() === 'kg'
      }, {
        onConflict: 'sku'
      });

    if (productError) {
      console.error('[admin/orders] Failed to create product:', productError);
      return NextResponse.json({ ok: false, error: "Failed to create product" }, { status: 500 });
    }

    // Create a new order line with custom product
    const { data: orderLine, error: lineError } = await sb
      .from('OrderLine')
      .insert({
        order_id: orderId,
        product_sku: customSku,
        uom: uom.toUpperCase(),
        requested_qty: parseFloat(weight),
        packed_weight: parseFloat(weight),
        packed_qty: parseFloat(weight),
        unit_price: parseFloat(unitPrice),
        substitution_allowed: false
      })
      .select()
      .single();

    if (lineError) {
      console.error('[admin/orders] Failed to add product to order:', lineError);
      return NextResponse.json({ ok: false, error: "Failed to add product to order" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderLine });
  } catch (error) {
    console.error('Failed to add product to order:', error);
    return NextResponse.json({ ok: false, error: "Failed to add product to order" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, lineId, packedWeight } = body;

    const sb = getSupabase();

    if (status) {
      // Update order status
      const { error } = await sb
        .from('Order')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('[admin/orders] Failed to update order status:', error);
        return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
      }
    }

    if (lineId && packedWeight !== undefined) {
      // Update packed weight for a specific order line
      const { error } = await sb
        .from('OrderLine')
        .update({ packed_weight: packedWeight, packed_qty: packedWeight })
        .eq('id', lineId);

      if (error) {
        console.error('[admin/orders] Failed to update order line:', error);
        return NextResponse.json({ ok: false, error: "Failed to update order line" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
  }
}
