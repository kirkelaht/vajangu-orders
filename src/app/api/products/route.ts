import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Return mock data for now
    const mockProducts = [
      {
        sku: 'PORK-001',
        name: 'Esimene veerand',
        category: 'Värske sealiha',
        uom: 'TK',
        catch_weight: false,
        active: true,
        currentPrice: 95.00
      },
      {
        sku: 'PORK-002',
        name: 'Tagumine veerand',
        category: 'Värske sealiha',
        uom: 'TK',
        catch_weight: false,
        active: true,
        currentPrice: 70.00
      },
      {
        sku: 'PORK-003',
        name: 'Keskosa',
        category: 'Värske sealiha',
        uom: 'TK',
        catch_weight: false,
        active: true,
        currentPrice: 85.00
      },
      {
        sku: 'PORK-004',
        name: 'Pool siga',
        category: 'Värske sealiha',
        uom: 'TK',
        catch_weight: false,
        active: true,
        currentPrice: 150.00
      },
      {
        sku: 'PORK-005',
        name: 'Terve siga',
        category: 'Värske sealiha',
        uom: 'TK',
        catch_weight: false,
        active: true,
        currentPrice: 310.00
      }
    ];
    
    return NextResponse.json({ ok: true, items: mockProducts });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

