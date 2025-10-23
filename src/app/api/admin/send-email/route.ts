import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, subject, message } = body;

    if (!orderId || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Order ID, subject, and message are required" }, { status: 400 });
    }

    // Fetch the order with customer details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        ring: true,
        stop: true
      }
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // Send custom email
    try {
      await sendCustomEmail(
        order.customer.email,
        order.customer.name,
        subject,
        message,
        {
          orderId: order.id,
          customerName: order.customer.name,
          ring: order.ring.region,
          stop: order.stop.name
        }
      );
    } catch (emailError) {
      console.error('Failed to send custom email:', emailError);
      return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Failed to send custom email:', error);
    return NextResponse.json({ ok: false, error: "Failed to send email" }, { status: 500 });
  }
}
