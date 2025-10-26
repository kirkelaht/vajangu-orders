// temporary redeploy fix
// production fix: ensure routes are properly deployed
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  console.log('[api/health] ok');
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}
