import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ringId = searchParams.get("ringId");
    if(!ringId) return NextResponse.json({ok:false, error:"ringId required"},{status:400});
    const items = await prisma.stop.findMany({ 
      where:{ ringId }, 
      orderBy:{ order_index:"asc" } 
    });
    return NextResponse.json({ ok:true, items });
  } catch (e: unknown) {
    console.error('GET /api/stops error:', e);
    return NextResponse.json({ ok:false, error:"Database connection failed" }, { status: 500 });
  }
}

