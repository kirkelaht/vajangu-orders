import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { sendInvoiceEmail } from "@/lib/email";

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

    // Fetch the order
    const { data: order, error: orderError } = await sb
      .from('Order')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[admin/invoice] Order not found:', orderError);
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Fetch related data separately
    const { data: customer, error: customerError } = await sb
      .from('Customer')
      .select('*')
      .eq('id', order.customerId || order.customer_id)
      .single();

    const { data: ring, error: ringError } = await sb
      .from('Ring')
      .select('*')
      .eq('id', order.ringId || order.ring_id)
      .single();

    const { data: stop, error: stopError } = await sb
      .from('Stop')
      .select('*')
      .eq('id', order.stopId || order.stop_id)
      .single();

    if (customerError || !customer) {
      console.error('[admin/invoice] Customer not found:', customerError);
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    if (ringError || !ring) {
      console.error('[admin/invoice] Ring not found:', ringError);
      return NextResponse.json({ ok: false, error: "Ring not found" }, { status: 404 });
    }

    if (stopError || !stop) {
      console.error('[admin/invoice] Stop not found:', stopError);
      return NextResponse.json({ ok: false, error: "Stop not found" }, { status: 404 });
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

    // Send invoice email
    try {
      if (!process.env.MAILERSEND_API_KEY) {
        console.log('[admin/invoice] MailerSend API key not configured - skipping email');
      } else {
        // Build products array for email
        const products = (lines || []).map((line: any) => {
          const unitPrice = line.unit_price ? Number(line.unit_price) : 0;
          const quantity = Number(line.packed_weight || line.packed_qty || line.requested_qty);
          const lineTotal = unitPrice * quantity;
          
          return {
            name: line.Product?.name || line.product_sku || 'Unknown product',
            sku: line.product_sku,
            quantity: quantity,
            uom: line.uom?.toLowerCase() || 'kg',
            unitPrice: unitPrice,
            lineTotal: lineTotal
          };
        });

        // Parse dates
        const orderDate = order.created_at ? new Date(order.created_at) : new Date();
        const invoiceDate = new Date();

        const emailResult = await sendInvoiceEmail(
          customer.email,
          customer.name,
          invoiceNumber,
          {
            orderId: order.id,
            orderDate: orderDate,
            invoiceDate: invoiceDate,
            customer: {
              name: customer.name,
              email: customer.email,
              phone: customer.phone || ''
            },
            ring: ring.region,
            stop: stop.name,
            deliveryType: (order.deliveryType || order.delivery_type) === 'HOME' ? 'HOME' : 'STOP',
            deliveryAddress: (order.deliveryAddress || order.delivery_address) || undefined,
            paymentMethod: (order.paymentMethod || order.payment_method) === 'TRANSFER' ? 'TRANSFER' : 'CASH',
            products: products,
            subtotal: subtotal,
            vatAmount: vatAmount,
            total: total
          }
        );

        if (emailResult.success) {
          console.log('[admin/invoice] Invoice email sent successfully to:', order.Customer.email, 'Message ID:', emailResult.messageId);
        } else {
          console.error('[admin/invoice] Failed to send invoice email:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('[admin/invoice] Exception in invoice email sending:', emailError);
      // Don't fail invoice generation if email fails
    }

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
