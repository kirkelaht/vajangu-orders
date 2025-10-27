import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
// import { sendOrderConfirmationEmail } from "@/lib/email";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  order_lines: Array<{ sku:string; uom:"kg"|"tk"; ordered_qty:number; substitution_allowed?:boolean; unit_price?:number }>;
};

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    
    // TEMPORARY: Return helpful error until Supabase is fully configured
    return NextResponse.json({
      ok: false,
      error: 'Order submission requires database setup. Please configure Supabase environment variables.'
    }, { status: 503 });
    
    /* ORIGINAL IMPLEMENTATION - TO BE RESTORED AFTER SUPABASE SETUP
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[api/orders] Missing Supabase configuration');
      return NextResponse.json({
        ok: false,
        error: 'Order system is temporarily unavailable. Please contact us directly.'
      }, { status: 503 });
    }

    // 1) minimaalne validatsioon
    if(!b?.customer?.email || !b?.customer?.phone || !b.ring_id || !b.stop_id || !b.order_lines?.length){
      return NextResponse.json({ok:false, error:"Missing required fields"}, { status: 400 });
    }

    // 2) cutoff kontroll
    const sb = getSupabase();
    const { data: ring, error: ringError } = await sb.from('Ring').select('id, region, cutoffAt, ringDate').eq('id', b.ring_id).single();
    
    if (ringError || !ring) {
      return NextResponse.json({ok:false, error:"Ring not found"},{status:404});
    }

    const now = new Date();
    if (ring.cutoffAt && now > new Date(ring.cutoffAt)) {
      return NextResponse.json({ok:false, error:"Cutoff passed for this ring"},{status:422});
    }

    // Check if this is home delivery ring
    const isHomeDelivery = ring.region === 'Viru-Nigula-Sonda ring';
    */

    // 3) duplikaadi hoiatus (sama phone+ring+stop viimase 24h jooksul)
    const dup = await prisma.order.findFirst({
      where:{
        customer: { phone: b.customer.phone },
        ring_id: b.ring_id,
        stop_id: b.stop_id,
        created_at: { gte: new Date(Date.now() - 24*60*60*1000) }
      },
      select:{ id:true }
    });
    const duplicate = !!dup;

    // 4) upsert customer
    const customer = await prisma.customer.upsert({
      where: { email: b.customer.email },
      update: { 
        name: b.customer.name, 
        phone: b.customer.phone, 
        org_name: b.customer.org_name || null,
        reg_code: b.customer.reg_code || null
      },
      create: { 
        name: b.customer.name, 
        phone: b.customer.phone, 
        email: b.customer.email, 
        org_name: b.customer.org_name || null,
        reg_code: b.customer.reg_code || null,
        segment: "RETAIL" // Default to retail for public orders
      }
    });

    // 5) create order + lines
    const order = await prisma.order.create({
      data:{
        channel: b.channel === "veeb" ? "WEB" : b.channel === "telefon" ? "PHONE" : b.channel === "FB" ? "FACEBOOK" : "EMAIL",
        customer_id: customer.id,
        ring_id: b.ring_id,
        stop_id: b.stop_id,
        delivery_type: isHomeDelivery ? "HOME" : "STOP",
        delivery_address: isHomeDelivery ? b.notes_customer : (b.delivery_address || null),
        status: "NEW",
        notes_customer: b.notes_customer || null,
        notes_internal: b.notes_internal || null,
        payment_method: b.payment_method==="ülekandega" ? "TRANSFER" : "CASH",
        lines: {
          create: b.order_lines.map(l=>({
            product: {
              connect: { sku: l.sku }
            },
            uom: l.uom.toUpperCase() as 'KG' | 'TK',
            requested_qty: l.ordered_qty,
            substitution_allowed: !!l.substitution_allowed,
            unit_price: l.unit_price || null
          }))
        }
      },
      include: { lines: true }
    });

    // 6) Send confirmation email
    try {
      const stop = await prisma.stop.findUnique({ where: { id: b.stop_id } });
      const productDetails = await Promise.all(
        b.order_lines.map(async (line) => {
          const product = await prisma.product.findUnique({ where: { sku: line.sku } });
          return {
            name: product?.name || line.sku,
            sku: line.sku,
            quantity: line.ordered_qty,
            uom: line.uom.toUpperCase()
          };
        })
      );

      await sendOrderConfirmationEmail(
        customer.email,
        customer.name,
        order.id,
        {
          ring: ring.region,
          stop: stop?.name || 'Unknown',
          deliveryType: isHomeDelivery ? 'HOME' : 'STOP',
          deliveryAddress: isHomeDelivery ? b.notes_customer : undefined,
          paymentMethod: b.payment_method === "ülekandega" ? "TRANSFER" : "CASH",
          products: productDetails
        }
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({ ok:true, orderId: order.id, duplicate }, { status: 200 });
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ ok:false, error:"Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return mock data for now
    const mockRings = [
      {
        id: 'ring-1',
        ring_date: '2025-11-07T00:00:00.000Z',
        region: 'Vändra–Enge ring',
        driver: null,
        visible_from: '2025-11-07T00:00:00.000Z',
        visible_to: null,
        cutoff_at: '2025-11-06T18:00:00.000Z',
        capacity_orders: null,
        capacity_kg: null,
        status: 'OPEN'
      },
      {
        id: 'ring-2',
        ring_date: '2025-11-12T00:00:00.000Z',
        region: 'Järva-Jaani–Kõmsi ring',
        driver: null,
        visible_from: '2025-11-12T00:00:00.000Z',
        visible_to: null,
        cutoff_at: '2025-11-11T18:00:00.000Z',
        capacity_orders: null,
        capacity_kg: null,
        status: 'OPEN'
      },
      {
        id: 'ring-3',
        ring_date: '2025-11-19T00:00:00.000Z',
        region: 'Kose–Haapsalu ring',
        driver: null,
        visible_from: '2025-11-19T00:00:00.000Z',
        visible_to: null,
        cutoff_at: '2025-11-18T18:00:00.000Z',
        capacity_orders: null,
        capacity_kg: null,
        status: 'OPEN'
      }
    ];
    
    return NextResponse.json({ ok: true, items: mockRings });
  } catch (e: unknown) {
    console.error('GET /api/orders error:', e);
    return NextResponse.json({ ok: false, error: "Database connection failed" }, { status: 500 });
  }
}
