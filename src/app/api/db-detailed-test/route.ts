import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test basic connection
    await prisma.$connect();
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test table access
    const tableCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;
    
    return NextResponse.json({ 
      ok: true, 
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      tests: {
        connection: "OK",
        simpleQuery: result,
        tableCount: tableCount
      }
    });
  } catch (error) {
    console.error('Detailed DB test error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
