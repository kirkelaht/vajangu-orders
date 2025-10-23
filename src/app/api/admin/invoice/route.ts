import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Order ID is required" }, { status: 400 });
    }

    // Fetch the order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        ring: true,
        stop: true,
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Generate invoice number
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Find the highest invoice number for this year
    const lastInvoice = await prisma.order.findFirst({
      where: {
        invoiceNumber: {
          startsWith: yearPrefix
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    });

    let nextNumber = 1;
    if (lastInvoice?.invoiceNumber) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    const invoiceNumber = `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;

    // Update order with invoice number and status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        invoiceNumber: invoiceNumber,
        status: 'INVOICED',
        invoicedAt: new Date()
      }
    });

    // Calculate totals
    const subtotal = order.lines.reduce((total, line) => {
      const unitPrice = line.unitPrice ? parseFloat(line.unitPrice) : 0;
      const quantity = line.packedWeight || line.requestedQty;
      return total + (unitPrice * quantity);
    }, 0);

    const vatRate = 0.20; // 20% VAT
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // Send invoice email
    try {
      await sendInvoiceEmail(
        order.customer.email,
        order.customer.name,
        invoiceNumber,
        {
          orderId: order.id,
          orderDate: order.createdAt,
          invoiceDate: new Date(),
          customer: order.customer,
          ring: order.ring.region,
          stop: order.stop.name,
          deliveryType: order.deliveryType,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          products: order.lines.map(line => ({
            name: line.product.name,
            sku: line.product.sku,
            quantity: line.packedWeight || line.requestedQty,
            uom: line.uom.toLowerCase(),
            unitPrice: line.unitPrice ? parseFloat(line.unitPrice) : 0,
            lineTotal: (line.unitPrice ? parseFloat(line.unitPrice) : 0) * (line.packedWeight || line.requestedQty)
          })),
          subtotal,
          vatAmount,
          total
        }
      );
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // Don't fail the invoice generation if email fails
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
