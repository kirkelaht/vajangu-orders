import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test if the API route is working at all
    return NextResponse.json({ 
      ok: true, 
      message: "API route is working",
      timestamp: new Date().toISOString(),
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlLength: process.env.DATABASE_URL?.length || 0
      }
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
