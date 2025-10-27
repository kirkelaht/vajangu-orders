import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
// import { sendInvoiceEmail } from "@/lib/email";

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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Order ID is required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Fetch the order with all related data
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

    // Generate invoice number
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Find the highest invoice number for this year
    const { data: lastInvoice } = await sb
      .from('Order')
      .select('invoice_number')
      .like('invoice_number', `${yearPrefix}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const invoiceNumber = `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;

    // Update order with invoice number and status
    const { error: updateError } = await sb
      .from('Order')
      .update({
        invoice_number: invoiceNumber,
        status: 'INVOICED',
        invoiced_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('[admin/invoice] Failed to update order:', updateError);
      return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
    }

    // Fetch order lines with products
    const { data: lines } = await sb
      .from('OrderLine')
      .select(`
        *,
        Product:product_sku (*)
      `)
      .eq('order_id', orderId);

    // Calculate totals
    const subtotal = (lines || []).reduce((total: number, line: any) => {
      const unitPrice = line.unit_price ? Number(line.unit_price) : 0;
      const quantity = Number(line.packed_weight || line.packed_qty || line.requested_qty);
      return total + (unitPrice * quantity);
    }, 0);

    const vatRate = 0.20; // 20% VAT
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // TODO: Send invoice email when email service is set up
    // try {
    //   await sendInvoiceEmail(
    //     order.Customer.email,
    //     order.Customer.name,
    //     invoiceNumber,
    //     { ... }
    //   );
    // } catch (emailError) {
    //   console.error('Failed to send invoice email:', emailError);
    // }

    return NextResponse.json({ 
      ok: true, 
      invoiceNumber,
      total: total.toFixed(2)
    });

  } catch (error) {
    console.error('Failed to generate invoice:', error);
    return NextResponse.json({ ok: false, error: "Failed to generate invoice" }, { status: 500 });
  }
}
