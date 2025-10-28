import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { sendCustomEmail } from "@/lib/email";

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
    console.log('[admin/send-email] POST request received');
    
    const body = await req.json();
    const { orderId, subject, message } = body;
    
    console.log('[admin/send-email] Request body:', { orderId, subject, message: message?.substring(0, 50) });

    if (!orderId || !subject || !message) {
      console.log('[admin/send-email] Missing required fields');
      return NextResponse.json({ ok: false, error: "Order ID, subject, and message are required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Fetch the order with customer details using camelCase column names
    const { data: order, error: orderError } = await sb
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('[admin/send-email] Order fetch result:', { hasOrder: !!order, error: orderError });

    if (orderError || !order) {
      console.error('[admin/send-email] Order not found:', orderError);
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await sb
      .from('Customer')
      .select('*')
      .eq('id', order.customerId)
      .single();

    // Fetch ring details
    const { data: ring, error: ringError } = await sb
      .from('Ring')
      .select('*')
      .eq('id', order.ringId)
      .single();

    // Fetch stop details
    const { data: stop, error: stopError } = await sb
      .from('Stop')
      .select('*')
      .eq('id', order.stopId)
      .single();

    console.log('[admin/send-email] Related data fetch:', { 
      hasCustomer: !!customer, 
      hasRing: !!ring, 
      hasStop: !!stop,
      errors: { customer: customerError, ring: ringError, stop: stopError }
    });

    if (!customer || !ring || !stop) {
      console.error('[admin/send-email] Order details incomplete:', { customerError, ringError, stopError });
      return NextResponse.json({ ok: false, error: "Order details incomplete" }, { status: 404 });
    }

    // Send custom email
    try {
      const emailResult = await sendCustomEmail(
        customer.email,
        customer.name,
        subject,
        message,
        {
          orderId: order.id,
          customerName: customer.name,
          ring: ring.region,
          stop: stop.name
        }
      );

      if (!emailResult.success) {
        console.error('Failed to send custom email:', emailResult.error);
        return NextResponse.json({ ok: false, error: emailResult.error || "Failed to send email" }, { status: 500 });
      }

      console.log('[admin/send-email] Email sent successfully to:', customer.email);
      return NextResponse.json({ ok: true, messageId: emailResult.messageId });
    } catch (emailError) {
      console.error('Failed to send custom email:', emailError);
      return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to send custom email:', error);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
