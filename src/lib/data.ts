import { supabase } from '@/lib/supabase';

export async function fetchRings() {
  const { data, error } = await supabase
    .from('Ring')
    .select('id, ringDate, region')
    .order('ringDate', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStopsByRing(ringId: string) {
  const { data, error } = await supabase
    .from('Stop')
    .select('id, name, place, order_index')
    .eq('ringId', ringId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
