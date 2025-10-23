import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: {
        priceItems: {
          include: {
            priceList: true
          },
          where: {
            priceList: {
              validFrom: { lte: new Date() },
              OR: [
                { validTo: null },
                { validTo: { gte: new Date() } }
              ]
            }
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Add current price to each product
    const productsWithPrices = products.map(product => ({
      ...product,
      currentPrice: product.priceItems[0]?.unitPrice || 0
    }));
    
    return NextResponse.json({ ok: true, items: productsWithPrices });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

