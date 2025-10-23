import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        ring: true,
        stop: true,
        lines: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ ok: true, orders });
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

    const customSku = `CUSTOM_${Date.now()}`;

    // Create a custom product entry first
    const customProduct = await prisma.product.upsert({
      where: { sku: customSku },
      update: {},
      create: {
        sku: customSku,
        name: productName,
        category: 'Kohandatud tooted',
        uom: uom.toUpperCase() as any,
        active: true,
        catchWeight: uom.toLowerCase() === 'kg'
      }
    });

    // Create a new order line with custom product
    const orderLine = await prisma.orderLine.create({
      data: {
        orderId: orderId,
        productSku: customSku,
        uom: uom.toUpperCase() as any,
        requestedQty: parseFloat(weight),
        packedWeight: parseFloat(weight),
        unitPrice: parseFloat(unitPrice),
        substitutionAllowed: false
      }
    });

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

    if (status) {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status }
      });
    }

    if (lineId && packedWeight !== undefined) {
      // Update packed weight for a specific order line
      await prisma.orderLine.update({
        where: { id: lineId },
        data: { packedWeight }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ ok: false, error: "Failed to update order" }, { status: 500 });
  }
}
