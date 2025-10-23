import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    // Check password against environment variable (server-side only)
    const adminPassword = process.env.ADMIN_PASSWORD || 'vajangu2025';
    
    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
