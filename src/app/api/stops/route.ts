import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ringId = searchParams.get("ringId");
  if(!ringId) return NextResponse.json({ok:false, error:"ringId required"},{status:400});
  const items = await prisma.stop.findMany({ where:{ ringId }, orderBy:{ sortOrder:"asc" } });
  return NextResponse.json({ ok:true, items });
}

