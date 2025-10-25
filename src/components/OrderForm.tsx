'use client';
import { useEffect, useMemo, useState } from 'react';
import { fetchRings, fetchStopsByRing } from '@/lib/data';

type Ring = { id: string; ringDate: string; region: string };
type Stop = { id: string; name: string; place: string; order_index: number };

export default function OrderForm() {
  const [rings, setRings] = useState<Ring[]>([]);
  const [ringId, setRingId] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => { (async () => setRings(await fetchRings()))(); }, []);
  useEffect(() => {
    if (!ringId) { setStops([]); return; }
    (async () => setStops(await fetchStopsByRing(ringId)))();
  }, [ringId]);

  const formatRing = (r: Ring) => {
    const d = new Date(r.ringDate);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${dd}.${mm} ${r.region}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1">Vali ring *</label>
        <select className="border rounded p-2 w-full" value={ringId} onChange={e=>setRingId(e.target.value)} required>
          <option value="">— Vali ring —</option>
          {rings.map(r => <option key={r.id} value={r.id}>{formatRing(r)}</option>)}
        </select>
      </div>

      <div>
        <label className="block mb-1">Vali peatus *</label>
        <select className="border rounded p-2 w-full" disabled={!ringId || stops.length===0} required defaultValue="">
          <option value="">— Vali peatus —</option>
          {stops.map(s => <option key={s.id} value={s.id}>{s.name} — {s.place}</option>)}
        </select>
      </div>
    </div>
  );
}
