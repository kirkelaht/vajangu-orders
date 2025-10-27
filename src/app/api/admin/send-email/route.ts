import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
// import { sendCustomEmail } from "@/lib/email";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, subject, message } = body;

    if (!orderId || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Order ID, subject, and message are required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Fetch the order with customer details
    const { data: order, error: orderError } = await sb
      .from('Order')
      .select(`
        *,
        Customer:customer_id (*),
        Ring:ring_id (*),
        Stop:stop_id (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // TODO: Send custom email when email service is set up
    // try {
    //   await sendCustomEmail(
    //     order.Customer.email,
    //     order.Customer.name,
    //     subject,
    //     message,
    //     {
    //       orderId: order.id,
    //       customerName: order.Customer.name,
    //       ring: order.Ring.region,
    //       stop: order.Stop.name
    //     }
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send custom email:', emailError);
    //   return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
    // }

    console.log('[admin/send-email] Email would be sent to:', order.Customer?.email);

    return NextResponse.json({ ok: true, message: 'Email functionality not yet implemented' });

  } catch (error) {
    console.error('Failed to send custom email:', error);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
