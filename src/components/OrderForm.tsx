'use client';
import { useEffect, useState } from 'react';

type Ring = { id: string; label: string; region: string; dateISO: string | null };
type Stop = { id: string; label: string; name: string; place: string; order_index: number };

export default function OrderForm() {
  const [rings, setRings] = useState<Ring[]>([]);
  const [ringId, setRingId] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState({ rings: false, stops: false });

  // Fetch rings on mount
  useEffect(() => {
    setLoading(prev => ({ ...prev, rings: true }));
    fetch('/api/rings')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`rings ${r.status}`)))
      .then(data => {
        if (Array.isArray(data)) {
          setRings(data);
        } else {
          console.error('[OrderForm] Invalid rings data:', data);
        }
      })
      .catch(e => console.error('[OrderForm] Error fetching rings:', e))
      .finally(() => setLoading(prev => ({ ...prev, rings: false })));
  }, []);

  // Fetch stops when ringId changes
  useEffect(() => {
    if (!ringId) { setStops([]); return; }
    setLoading(prev => ({ ...prev, stops: true }));
    fetch(`/api/stops?ringId=${encodeURIComponent(ringId)}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`stops ${r.status}`)))
      .then(data => {
        if (Array.isArray(data)) {
          setStops(data);
        } else {
          console.error('[OrderForm] Invalid stops data:', data);
        }
      })
      .catch(e => console.error('[OrderForm] Error fetching stops:', e))
      .finally(() => setLoading(prev => ({ ...prev, stops: false })));
  }, [ringId]);

  return (
    <div className="space-y-6 p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Dropdowns</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vali ring * {loading.rings && <span className="text-blue-600">(Loading...)</span>}
        </label>
        <select 
          className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent" 
          value={ringId} 
          onChange={e => setRingId(e.target.value)}
          disabled={loading.rings}
        >
          <option value="">— Vali ring —</option>
          {rings.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Found {rings.length} rings</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vali peatus * {loading.stops && <span className="text-blue-600">(Loading...)</span>}
        </label>
        <select 
          className="border border-gray-300 p-3 w-full rounded focus:ring-2 focus:ring-gray-500 focus:border-transparent" 
          disabled={!ringId || stops.length === 0 || loading.stops} 
          defaultValue=""
        >
          <option value="">— Vali peatus —</option>
          {stops.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Found {stops.length} stops for ring {ringId}</p>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <div className="text-sm space-y-1">
          <div>Rings: {rings.length} items</div>
          <div>Stops: {stops.length} items (for ring: {ringId || 'none'})</div>
          <div>Loading: rings={loading.rings.toString()}, stops={loading.stops.toString()}</div>
        </div>
      </div>
    </div>
  );
}
