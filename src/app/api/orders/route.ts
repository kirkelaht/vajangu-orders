import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

    // 1) minimaalne validatsioon
    if(!b?.customer?.email || !b?.customer?.phone || !b.ring_id || !b.stop_id || !b.order_lines?.length){
      return NextResponse.json({ok:false, error:"Missing required fields"}, { status: 400 });
    }

    // 2) cutoff kontroll
    const ring = await prisma.ring.findUnique({ where:{ id: b.ring_id } });
    if(!ring) return NextResponse.json({ok:false, error:"Ring not found"},{status:404});

    const now = new Date();
    if(now > ring.cutoffAt){
      return NextResponse.json({ok:false, error:"Cutoff passed for this ring"},{status:422});
    }

    // Check if this is home delivery ring
    const isHomeDelivery = ring.region === 'Viru-Nigula-Sonda ring';

    // 3) duplikaadi hoiatus (sama phone+ring+stop viimase 24h jooksul)
    const dup = await prisma.order.findFirst({
      where:{
        customer: { phone: b.customer.phone },
        ringId: b.ring_id,
        stopId: b.stop_id,
        createdAt: { gte: new Date(Date.now() - 24*60*60*1000) }
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
        orgName: b.customer.org_name || null,
        regCode: b.customer.reg_code || null
      },
      create: { 
        name: b.customer.name, 
        phone: b.customer.phone, 
        email: b.customer.email, 
        orgName: b.customer.org_name || null,
        regCode: b.customer.reg_code || null,
        segment: "RETAIL" // Default to retail for public orders
      }
    });

    // 5) create order + lines
    const order = await prisma.order.create({
      data:{
        channel: b.channel === "veeb" ? "WEB" : b.channel === "telefon" ? "PHONE" : b.channel === "FB" ? "FACEBOOK" : "EMAIL",
        customerId: customer.id,
        ringId: b.ring_id,
        stopId: b.stop_id,
        deliveryType: isHomeDelivery ? "HOME" : "STOP",
        deliveryAddress: isHomeDelivery ? b.notes_customer : (b.delivery_address || null),
        status: "NEW",
        notesCustomer: b.notes_customer || null,
        notesInternal: b.notes_internal || null,
        paymentMethod: b.payment_method==="ülekandega" ? "TRANSFER" : "CASH",
        lines: {
          create: b.order_lines.map(l=>({
            product: {
              connect: { sku: l.sku }
            },
            uom: l.uom.toUpperCase() as 'KG' | 'TK',
            requestedQty: l.ordered_qty,
            substitutionAllowed: !!l.substitution_allowed,
            unitPrice: l.unit_price || null
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
    const now = new Date();
    const items = await prisma.ring.findMany({
      where:{ visibleFrom:{ lte: now }, visibleTo:{ gte: now }, cutoffAt:{ gt: now }, status:"OPEN" },
      orderBy:{ ringDate:"asc" }
    });
    return NextResponse.json({ ok:true, items });
  } catch (e: unknown) {
    console.error('GET /api/orders error:', e);
    return NextResponse.json({ ok:false, error:"Database connection failed" }, { status: 500 });
  }
}
