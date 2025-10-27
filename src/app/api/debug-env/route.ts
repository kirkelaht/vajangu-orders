import { NextResponse } from "next/server";

export async function GET() {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const urlPrefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) || 'missing';
  const keyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
  
  return NextResponse.json({
    hasUrl,
    hasServiceRoleKey: hasKey,
    hasAnonKey,
    urlPrefix,
    keyLength: hasKey ? keyLength : 0,
    keyStartsWith: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'missing',
    message: hasUrl && hasKey ? 'Environment looks good' : 'Missing required environment variables'
  });
}

