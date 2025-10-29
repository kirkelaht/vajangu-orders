import { NextResponse } from 'next/server';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(url, key);
}

// GET: Fetch editable products
export async function GET() {
  try {
    const sb = getSupabase();
    
    const editableSkus = [
      'veerand-esimene',
      'veerand-tagumine',
      'keskosa',
      'rebitud-seakulg',
      'pool-siga',
      'terve-siga'
    ];

    const { data, error } = await sb
      .from('Product')
      .select('sku, name, unit, priceCents')
      .in('sku', editableSkus);

    if (error) {
      console.error('[admin/products] Error fetching products:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, products: data || [] });
  } catch (error: any) {
    console.error('[admin/products] Failed to fetch products:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

// PATCH: Update product price and weight
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { sku, priceCents, weightRange } = body;

    if (!sku || priceCents === undefined) {
      return NextResponse.json({ ok: false, error: 'Missing required fields: sku and priceCents' }, { status: 400 });
    }

    const sb = getSupabase();

    // First, get the current product to preserve the name structure
    const { data: currentProduct, error: fetchError } = await sb
      .from('Product')
      .select('name')
      .eq('sku', sku)
      .single();

    if (fetchError) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    // Update name with new weight range if provided
    let updatedName = currentProduct.name;
    if (weightRange) {
      // Extract product name prefix (before "kaalub")
      const kaalubMatch = currentProduct.name.match(/^(.+?)\s+kaalub\s+\d+-\d+kg/);
      if (kaalubMatch) {
        const productPrefix = kaalubMatch[1].trim();
        
        // Extract kilohind from name
        const kilohindMatch = currentProduct.name.match(/kilohind\s+([\d,]+€)/);
        const kilohind = kilohindMatch ? kilohindMatch[1] : '';
        
        // Reconstruct name with new weight range
        updatedName = `${productPrefix} kaalub ${weightRange}kg, kilohind ${kilohind}. Täpne hind selgub peale komplekteerimist. Siin toodud hind on ligikaudne.`;
      }
    }

    // Update product
    const updateData: any = {
      priceCents: Math.round(parseFloat(priceCents) * 100)
    };

    if (weightRange) {
      updateData.name = updatedName;
    }

    const { data, error } = await sb
      .from('Product')
      .update(updateData)
      .eq('sku', sku)
      .select()
      .single();

    if (error) {
      console.error('[admin/products] Error updating product:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, product: data });
  } catch (error: any) {
    console.error('[admin/products] Failed to update product:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

