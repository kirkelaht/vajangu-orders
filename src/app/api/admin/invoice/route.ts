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

    console.log('[admin/invoice] Received request with orderId:', orderId);

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Order ID is required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Trim orderId to handle any whitespace issues
    const trimmedOrderId = orderId?.toString().trim();
    
    console.log('[admin/invoice] Attempting to fetch order:', trimmedOrderId);

    // Fetch the order - try without .single() first to see what we get
    const { data: orders, error: orderListError } = await sb
      .from('Order')
      .select('*')
      .eq('id', trimmedOrderId);

    console.log('[admin/invoice] Order list query result:', { 
      count: orders?.length || 0,
      error: orderListError,
      orderIds: orders?.map((o: any) => o.id)
    });

    if (orderListError) {
      console.error('[admin/invoice] Order query failed:', orderListError);
      return NextResponse.json({ ok: false, error: `Order query failed: ${orderListError.message}` }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      console.error('[admin/invoice] Order not found. Searched for orderId:', trimmedOrderId);
      // Try to see if any orders exist at all
      const { count } = await sb.from('Order').select('*', { count: 'exact', head: true });
      console.log('[admin/invoice] Total orders in database:', count);
      return NextResponse.json({ ok: false, error: `Order not found with ID: ${trimmedOrderId}` }, { status: 404 });
    }

    const order = orders[0];
    console.log('[admin/invoice] Order found:', { 
      orderId: order.id,
      customerId: order.customerId || order.customer_id,
      ringId: order.ringId || order.ring_id,
      stopId: order.stopId || order.stop_id
    });

    // Fetch related data separately
    // Handle both camelCase and snake_case column names
    const customerId = order.customerId || order.customer_id;
    const ringId = order.ringId || order.ring_id;
    const stopId = order.stopId || order.stop_id;

    console.log('[admin/invoice] Fetching related data:', { customerId, ringId, stopId });

    const { data: customer, error: customerError } = await sb
      .from('Customer')
      .select('*')
      .eq('id', customerId)
      .single();

    const { data: ring, error: ringError } = await sb
      .from('Ring')
      .select('*')
      .eq('id', ringId)
      .single();

    const { data: stop, error: stopError } = await sb
      .from('Stop')
      .select('*')
      .eq('id', stopId)
      .single();

    console.log('[admin/invoice] Related data fetch results:', {
      hasCustomer: !!customer,
      customerError,
      hasRing: !!ring,
      ringError,
      hasStop: !!stop,
      stopError
    });

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

    // Check if order already has an invoice number
    const existingInvoiceNumber = order.invoice_number || order.invoiceNumber;
    
    let invoiceNumber = existingInvoiceNumber;
    let needsUpdate = false;
    
    if (!invoiceNumber) {
      needsUpdate = true;
      
      // Generate new invoice number
      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString();
      
      // Find all invoice numbers for this year (not just one)
      // Handle both column name formats
      const { data: existingInvoices1 } = await sb
        .from('Order')
        .select('invoice_number')
        .not('invoice_number', 'is', null)
        .like('invoice_number', `${yearPrefix}-%`);
        
      const { data: existingInvoices2 } = await sb
        .from('Order')
        .select('invoiceNumber')
        .not('invoiceNumber', 'is', null)
        .like('invoiceNumber', `${yearPrefix}-%`);

      // Combine both results
      const allInvoices: string[] = [];
      if (existingInvoices1) {
        existingInvoices1.forEach((inv: any) => {
          if (inv.invoice_number) allInvoices.push(inv.invoice_number);
        });
      }
      if (existingInvoices2) {
        existingInvoices2.forEach((inv: any) => {
          if (inv.invoiceNumber) allInvoices.push(inv.invoiceNumber);
        });
      }

      console.log('[admin/invoice] Existing invoices for this year:', {
        count: allInvoices.length,
        sampleInvoices: allInvoices.slice(0, 5)
      });

      // Find the highest number
      let maxNumber = 0;
      allInvoices.forEach((invNum: string) => {
        if (invNum && invNum.startsWith(yearPrefix)) {
          const parts = invNum.split('-');
          if (parts.length > 1) {
            const num = parseInt(parts[1]);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      });

      let nextNumber = maxNumber + 1;
      
      // Try to find a unique invoice number (handle race conditions)
      let attempts = 0;
      let foundUnique = false;
      
      while (!foundUnique && attempts < 10) {
        invoiceNumber = `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;
        
        // Check if this invoice number already exists - check both column formats
        const { data: existing1 } = await sb
          .from('Order')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .limit(1);
          
        const { data: existing2 } = await sb
          .from('Order')
          .select('id')
          .eq('invoiceNumber', invoiceNumber)
          .limit(1);
        
        if ((!existing1 || existing1.length === 0) && (!existing2 || existing2.length === 0)) {
          foundUnique = true;
        } else {
          nextNumber++;
          attempts++;
        }
      }
      
      if (!foundUnique) {
        // Fallback: use timestamp
        invoiceNumber = `${yearPrefix}-${Date.now().toString().slice(-6)}`;
        console.warn('[admin/invoice] Could not find unique invoice number, using timestamp-based:', invoiceNumber);
      }
      
      console.log('[admin/invoice] Generated invoice number:', invoiceNumber);
    } else {
      console.log('[admin/invoice] Order already has invoice number:', invoiceNumber);
      // If order already has invoice number, we might still need to update status
      needsUpdate = order.status !== 'INVOICED';
    }

    // Only update if we need to (new invoice number or status change)
    if (needsUpdate) {
      // Update order with invoice number and status
      // Determine which column format to use based on what exists in the order object
      const hasCamelCase = 'invoiceNumber' in order || 'invoicedAt' in order;
      const hasSnakeCase = 'invoice_number' in order || 'invoiced_at' in order;
      
      const updateData: any = {
        status: 'INVOICED'
      };
      
      // Only add invoice number if we generated a new one
      if (!existingInvoiceNumber) {
        // Use the format that exists in the database
        if (hasSnakeCase) {
          updateData.invoice_number = invoiceNumber;
          updateData.invoiced_at = new Date().toISOString();
        } else if (hasCamelCase) {
          updateData.invoiceNumber = invoiceNumber;
          updateData.invoicedAt = new Date().toISOString();
        } else {
          // Default to snake_case (most common after migration)
          updateData.invoice_number = invoiceNumber;
          updateData.invoiced_at = new Date().toISOString();
        }
      } else {
        // Just update the timestamp if invoice number already exists
        if (hasSnakeCase) {
          updateData.invoiced_at = new Date().toISOString();
        } else if (hasCamelCase) {
          updateData.invoicedAt = new Date().toISOString();
        } else {
          updateData.invoiced_at = new Date().toISOString();
        }
      }
      
      console.log('[admin/invoice] Updating order with:', { 
        orderId: trimmedOrderId,
        invoiceNumber,
        updateData: Object.keys(updateData),
        hasCamelCase,
        hasSnakeCase,
        existingInvoiceNumber,
        orderKeys: Object.keys(order).slice(0, 10) // First 10 keys for debugging
      });
      
      const { error: updateError } = await sb
        .from('Order')
        .update(updateData)
        .eq('id', trimmedOrderId);

      if (updateError) {
        console.error('[admin/invoice] Failed to update order:', {
          error: updateError,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          orderId: trimmedOrderId,
          updateData
        });
        return NextResponse.json({ 
          ok: false, 
          error: `Failed to update order: ${updateError.message || 'Unknown error'}` 
        }, { status: 500 });
      }
      
      console.log('[admin/invoice] Order updated successfully with invoice number:', invoiceNumber);
    } else {
      console.log('[admin/invoice] Order already has invoice number, skipping update:', invoiceNumber);
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
    // VAT is already included in prices (24%), so we need to calculate backwards
    const vatRate = 0.24; // 24% VAT
    
    // Total price with VAT included
    const totalWithVat = (lines || []).reduce((total: number, line: any) => {
      const unitPrice = line.unit_price ? Number(line.unit_price) : 0;
      const quantity = Number(line.packed_weight || line.packed_qty || line.requested_qty);
      return total + (unitPrice * quantity);
    }, 0);
    
    // Calculate subtotal without VAT: total / (1 + VAT rate)
    const subtotal = totalWithVat / (1 + vatRate);
    
    // VAT amount = total - subtotal
    const vatAmount = totalWithVat - subtotal;
    
    // Total (with VAT) = what we already calculated
    const total = totalWithVat;

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
        const orderDate = (order.createdAt || order.created_at) ? new Date(order.createdAt || order.created_at) : new Date();
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
          console.log('[admin/invoice] Invoice email sent successfully to:', customer.email, 'Message ID:', emailResult.messageId);
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
