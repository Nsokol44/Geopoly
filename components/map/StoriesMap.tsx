'use client'
// components/map/StoriesMap.tsx
// The world map of stories. Leaflet + dark CARTO tiles, a
// pulsing dolla-yellow pin per located story, popup links
// through to the story. Stories without real coordinates
// (voice submissions carry none) simply aren't pinned.
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { Story } from '@/types'

export function hasLocation(s: Story): boolean {
  const lat = s.latitude, lng = s.longitude
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

const PIN_CSS = `
.dolla-pin { position: relative; width: 16px; height: 16px; }
.dolla-pin::before { content: ''; position: absolute; inset: -5px; border-radius: 50%;
  border: 2px solid #facc15; opacity: .8; animation: dolla-ping 2.4s ease-out infinite; }
.dolla-pin::after { content: ''; position: absolute; inset: 0; border-radius: 50%;
  background: #facc15; box-shadow: 0 0 12px 2px rgba(250,204,21,.7); }
@keyframes dolla-ping { 0% { transform: scale(.5); opacity: .9; } 70%, 100% { transform: scale(1.9); opacity: 0; } }
.dolla-popup .leaflet-popup-content-wrapper { background: #18181b; color: #fafafa; border: 1px solid #3f3f46; border-radius: 14px; }
.dolla-popup .leaflet-popup-tip { background: #18181b; }
.dolla-popup a { color: #facc15; font-weight: 800; text-decoration: none; }
`

export default function StoriesMap({ stories }: { stories: Story[] }) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const layerRef = useRef<any>(null)
  const LRef = useRef<any>(null)

  // Create the map once.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !elRef.current || mapRef.current) return
      LRef.current = L
      const map = L.map(elRef.current, { scrollWheelZoom: false, worldCopyJump: true })
      map.setView([25, 0], 2)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map)
      mapRef.current = map
      layerRef.current = L.layerGroup().addTo(map)
      draw()
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = () => {
    const L = LRef.current, map = mapRef.current, layer = layerRef.current
    if (!L || !map || !layer) return
    layer.clearLayers()
    const pts: [number, number][] = []
    for (const s of stories) {
      if (!hasLocation(s)) continue
      const icon = L.divIcon({ className: '', html: '<div class="dolla-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
      const where = [s.location_name, s.country_name].filter(Boolean).join(', ')
      const popup = `
        <div style="min-width:170px">
          <div style="font-weight:900;font-size:14px;line-height:1.25;margin-bottom:2px">${escapeHtml(s.title)}</div>
          <div style="color:#a1a1aa;font-size:12px;margin-bottom:6px">by ${escapeHtml(s.author_name)}${where ? ` · ${escapeHtml(where)}` : ''}</div>
          <a href="/story/${s.id}">Hear it →</a>
        </div>`
      L.marker([s.latitude, s.longitude], { icon }).bindPopup(popup, { className: 'dolla-popup' }).addTo(layer)
      pts.push([s.latitude as number, s.longitude as number])
    }
    if (pts.length === 1) map.setView(pts[0], 5)
    else if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 5 })
  }

  // Redraw pins whenever the (filtered) story set changes.
  useEffect(() => { draw() }) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <style>{PIN_CSS}</style>
      <div ref={elRef} className="h-[340px] md:h-[420px] w-full rounded-2xl border border-zinc-800 overflow-hidden z-0 bg-zinc-900" />
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
