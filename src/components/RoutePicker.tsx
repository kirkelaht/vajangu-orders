"use client"

import { useEffect, useMemo, useState } from "react"

type Stop = { id: string; name: string; meeting_point?: string }
type Route = { id: string; name: string; stops: Stop[] }
type DatesRow = { route_id: string; dates: string[] }

// ---- Väike helper, mis proovib esmalt public JSON-i, siis /api/routes fallbacki
async function loadRoutesAndDates(): Promise<{ routes: Route[]; routeDates: DatesRow[] }> {
  // 1) Proovi public JSON faile
  try {
    const [r1, r2] = await Promise.all([
      fetch("/routes.json", { cache: "no-store" }),
      fetch("/route-dates.json", { cache: "no-store" })
    ])
    if (!r1.ok) throw new Error(`/routes.json HTTP ${r1.status}`)
    if (!r2.ok) throw new Error(`/route-dates.json HTTP ${r2.status}`)
    const j1 = await r1.json()
    const j2 = await r2.json()

    const routes: Route[] = j1?.routes ?? []
    const routeDates: DatesRow[] = j2?.routeDates ?? []
    if (!Array.isArray(routes) || !Array.isArray(routeDates)) {
      throw new Error("public JSON kuju vale (routes/routeDates puudub või pole massiiv).")
    }
    return { routes, routeDates }
  } catch (err) {
    // 2) Fallback: proovi /api/routes
    console.warn("[RoutePicker] public JSON ei töötanud, proovin /api/routes. Põhjus:", err)
    const r = await fetch("/api/routes", { cache: "no-store" })
    if (!r.ok) {
      const t = await r.text()
      throw new Error(`/api/routes HTTP ${r.status}: ${t}`)
    }
    const j = await r.json()
    // normaliseeri /api/routes kuju -> samaks
    const apiRoutes = (j?.routes ?? []).map((row: any) => ({
      id: row.route_id ?? row.id,
      name: row.route_name ?? row.name,
      stops: (row.stops ?? []).map((s: any) => ({
        id: s.id, name: s.name, meeting_point: s.meeting_point ?? s.meetingPoint ?? undefined
      }))
    })) as Route[]
    const apiDates = (j?.routeDates ?? []).map((d: any) => ({
      route_id: d.route_id ?? d.id, dates: d.dates ?? []
    })) as DatesRow[]
    return { routes: apiRoutes, routeDates: apiDates }
  }
}

export default function RoutePicker() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [routeDates, setRouteDates] = useState<DatesRow[]>([])

  const [date, setDate] = useState("")
  const [routeId, setRouteId] = useState("")
  const [stopId, setStopId] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        const { routes, routeDates } = await loadRoutesAndDates()
        setRoutes(routes)
        setRouteDates(routeDates)
      } catch (e: any) {
        setErr(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // DIAGNOSTIKA kast (jääb kuni kõik paigas)
  const diagBox = (
    <div className="rounded-md border p-3 text-sm my-3">
      <div className="font-medium">Diagnostika</div>
      <div>Loaded routes: <b>{routes.length}</b></div>
      <div>Loaded routeDates: <b>{routeDates.length}</b></div>
      <div>
        Esimesed kuupäevad:{" "}
        <code>
          {Array.from(new Set(routeDates.flatMap(r => r.dates))).slice(0,8).join(", ") || "—"}
        </code>
      </div>
      {!!err && (
        <div className="mt-2 text-red-600">
          Viga: {err}
        </div>
      )}
      <div className="mt-2 opacity-70">
        Kui <b>routes=0</b> või <b>routeDates=0</b>, ava uues aknas <code>/routes.json</code> ja <code>/route-dates.json</code>.
        Need peavad näitama JSON-i. Kui 404, siis failid pole <code>public/</code> kaustas või deploy puudus.
      </div>
    </div>
  )

  if (loading) return <p>Laen ringe…</p>

  // Kuupäevade kogum
  const allDates = useMemo(() => {
    const s = new Set<string>()
    routeDates.forEach(rd => rd.dates?.forEach((d: string) => s.add(d)))
    return Array.from(s).sort()
  }, [routeDates])

  // Valitud kuupäeval saadaolevad ringid
  const routesForDate = useMemo(() => {
    if (!date) return []
    const allowed = new Set(routeDates.filter(rd => rd.dates?.includes(date)).map(rd => rd.route_id))
    return routes.filter(r => allowed.has(r.id))
  }, [date, routeDates, routes])

  // Valitud ringi peatused
  const stopsForRoute = useMemo(() => {
    return routes.find(r => r.id === routeId)?.stops ?? []
  }, [routeId, routes])

  return (
    <div>
      {diagBox}

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Kuupäev */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Kuupäev</label>
          <select
            className="border rounded px-2 py-2"
            value={date}
            onChange={e => { setDate(e.target.value); setRouteId(""); setStopId("") }}
          >
            <option value="">Vali kuupäev…</option>
            {allDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Ring */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Ring</label>
          <select
            className="border rounded px-2 py-2"
            value={routeId}
            onChange={e => { setRouteId(e.target.value); setStopId("") }}
            disabled={!date}
          >
            <option value="">{date ? "Vali ring…" : "Vali enne kuupäev"}</option>
            {routesForDate.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {/* Peatus */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Peatus</label>
          <select
            className="border rounded px-2 py-2"
            value={stopId}
            onChange={e => setStopId(e.target.value)}
            disabled={!routeId}
          >
            <option value="">{routeId ? "Vali peatus…" : "Vali enne ring"}</option>
            {stopsForRoute.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}{s.meeting_point ? ` — ${s.meeting_point}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
