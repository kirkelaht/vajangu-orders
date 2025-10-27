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

type Body = {
  channel: "veeb" | "telefon" | "FB" | "e_post";
  customer: { name:string; phone:string; email:string; org_name?:string; reg_code?:string };
  ring_id: string;
  stop_id: string;
  delivery_address?: string;
  notes_customer?: string;
  notes_internal?: string;
  payment_method: "sularaha"|"ülekandega";
  order_lines: Array< { sku:string; uom:"kg"|"tk"; ordered_qty:number; substitution_allowed?:boolean; unit_price?:number }>;
};

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[api/orders] Missing Supabase configuration');
      return NextResponse.json({
        ok: false,
        error: 'Order system is temporarily unavailable. Please contact us directly.'
      }, { status: 503 });
    }

    // 1) Validation
    if(!b?.customer?.email || !b?.customer?.phone || !b.ring_id || !b.stop_id || !b.order_lines?.length){
      return NextResponse.json({ok:false, error:"Missing required fields"}, { status: 400 });
    }

    const sb = getSupabase();

    // 2) Check ring exists and cutoff
    const { data: ring, error: ringError } = await sb
      .from('Ring')
      .select('id, region, cutoffAt, ringDate')
      .eq('id', b.ring_id)
      .single();
    
    if (ringError || !ring) {
      return NextResponse.json({ok:false, error:"Ring not found"},{status:404});
    }

    const now = new Date();
    if (ring.cutoffAt && now > new Date(ring.cutoffAt)) {
      return NextResponse.json({ok:false, error:"Cutoff passed for this ring"},{status:422});
    }

    const isHomeDelivery = ring.region === 'Viru-Nigula-Sonda ring';

    // 3) Check for duplicate orders (last 24h)
    const { data: duplicateOrder } = await sb
      .from('Order')
      .select('id')
      .eq('customer.phone', b.customer.phone)
      .eq('ring_id', b.ring_id)
      .eq('stop_id', b.stop_id)
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .limit(1)
      .single();

    // 4) Upsert customer
    const { data: existingCustomer } = await sb
      .from('Customer')
      .select('id, name, phone, email, org_name, reg_code, segment')
      .eq('email', b.customer.email)
      .single();

    let customerId: string;
    if (existingCustomer) {
      // Update existing customer
      const { error: updateError } = await sb
        .from('Customer')
        .update({
          name: b.customer.name,
          phone: b.customer.phone,
          org_name: b.customer.org_name || null,
          reg_code: b.customer.reg_code || null
        })
        .eq('id', existingCustomer.id);
      
      if (updateError) {
        console.error('[api/orders] Failed to update customer:', updateError);
        return NextResponse.json({ok:false, error:"Failed to update customer"},{status:500});
      }
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await sb
        .from('Customer')
        .insert({
          name: b.customer.name,
          phone: b.customer.phone,
          email: b.customer.email,
          org_name: b.customer.org_name || null,
          reg_code: b.customer.reg_code || null,
          segment: "RETAIL"
        })
        .select('id')
        .single();

      if (createError || !newCustomer) {
        console.error('[api/orders] Failed to create customer:', createError);
        return NextResponse.json({ok:false, error:"Failed to create customer"},{status:500});
      }
      customerId = newCustomer.id;
    }

    // 5) Create order
    const channelMap: Record<string, string> = {
      "veeb": "WEB",
      "telefon": "PHONE",
      "FB": "FACEBOOK",
      "e_post": "EMAIL"
    };

    const { data: order, error: orderError } = await sb
      .from('Order')
      .insert({
        channel: channelMap[b.channel] || "WEB",
        customer_id: customerId,
        ring_id: b.ring_id,
        stop_id: b.stop_id,
        delivery_type: isHomeDelivery ? "HOME" : "STOP",
        delivery_address: isHomeDelivery ? b.notes_customer : (b.delivery_address || null),
        status: "NEW",
        notes_customer: b.notes_customer || null,
        notes_internal: b.notes_internal || null,
        payment_method: b.payment_method === "ülekandega" ? "TRANSFER" : "CASH"
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[api/orders] Failed to create order:', orderError);
      return NextResponse.json({ok:false, error:"Failed to create order"},{status:500});
    }

    // 6) Create order lines
    const orderLines = b.order_lines.map(line => ({
      order_id: order.id,
      product_sku: line.sku,
      uom: line.uom.toUpperCase() as 'KG' | 'TK',
      requested_qty: line.ordered_qty,
      substitution_allowed: !!line.substitution_allowed,
      unit_price: line.unit_price || null
    }));

    const { error: linesError } = await sb
      .from('OrderLine')
      .insert(orderLines);

    if (linesError) {
      console.error('[api/orders] Failed to create order lines:', linesError);
      return NextResponse.json({ok:false, error:"Failed to create order lines"},{status:500});
    }

    // TODO: Send confirmation email when email service is set up
    // try {
    //   const stop = await sb.from('Stop').select('name').eq('id', b.stop_id).single();
    //   await sendOrderConfirmationEmail(customer.email, ...);
    // } catch (emailError) {
    //   console.error('Failed to send confirmation email:', emailError);
    // }

    return NextResponse.json({ 
      ok: true, 
      orderId: order.id,
      duplicate: !!duplicateOrder 
    }, { status: 200 });

  } catch (e: unknown) {
    console.error('[api/orders] exception:', e);
    return NextResponse.json({ ok:false, error:"Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sb = getSupabase();
    
    const { data: rings, error } = await sb
      .from('Ring')
      .select('id, ringDate, region, cutoffAt, status')
      .order('ringDate', { ascending: true });

    if (error) {
      console.error('[api/orders GET] error:', error);
      return NextResponse.json({ ok: false, error: "Database connection failed" }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, items: rings || [] });
  } catch (e: unknown) {
    console.error('[api/orders GET] exception:', e);
    return NextResponse.json({ ok: false, error: "Database connection failed" }, { status: 500 });
  }
}
