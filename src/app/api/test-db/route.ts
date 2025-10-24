import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Simple test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ 
      ok: true, 
      message: "Database connection successful",
      result 
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}
