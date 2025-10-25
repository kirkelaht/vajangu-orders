import { supabase } from '@/lib/supabase';

export async function fetchRings() {
  // Check if visibility filtering feature flag is enabled
  const enableVisibilityFilter = process.env.NEXT_PUBLIC_ENABLE_VISIBILITY_FILTER === 'true';
  
  let query = supabase
    .from('rings')
    .select('id, ring_date, region, visible_from')
    .order('ring_date', { ascending: true });
  
  // Only apply visibility filter if feature flag is enabled
  if (enableVisibilityFilter) {
    const now = new Date().toISOString();
    query = query.gte('visible_from', '1970-01-01T00:00:00.000Z'); // epoch as fallback
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchStopsByRing(ringId: string) {
  const { data, error } = await supabase
    .from('stops')
    .select('id, name, place, order_index')
    .eq('ring_id', ringId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
