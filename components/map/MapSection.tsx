'use client'
// components/map/MapSection.tsx
// Uses global Leaflet loaded via CDN <script> tags in layout.tsx
// Mirrors the Geopoly WordPress theme approach exactly — no npm imports of L.

import { useRef, useEffect, useState, useCallback } from 'react'
import type { MapStory, StoryCategory } from '@/types'
import { CATEGORY_COLORS } from '@/lib/utils'
import { MapControls } from './MapControls'
import { MapPopup } from './MapPopup'

interface Props {
  stories: MapStory[]
  countryStats?: CountryStats[]
}

type ViewMode = 'points' | 'heatmap'

const PING_CSS = `
@keyframes cs-ping {
  0%   { transform: scale(1);   opacity: 0.9; }
  70%  { transform: scale(3.5); opacity: 0; }
  100% { transform: scale(3.5); opacity: 0; }
}
@keyframes cs-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
.cs-wrap {
  position: relative; width: 14px; height: 14px; cursor: pointer;
}
.cs-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid var(--mc);
  animation: cs-ping 2.5s ease-out infinite;
  pointer-events: none;
}
.cs-ring-2 { animation-delay: 0.9s; }
.cs-dot {
  position: absolute; inset: 0; border-radius: 50%;
  background: var(--mc);
  box-shadow: 0 0 10px 2px var(--mc);
  animation: cs-pulse 3s ease-in-out infinite;
  transition: transform 0.15s ease;
}
.cs-wrap:hover .cs-dot { transform: scale(1.6); }
.leaflet-control-zoom a {
  background: rgba(15,23,42,0.92) !important;
  border-color: #1e293b !important;
  color: #94a3b8 !important;
}
.leaflet-control-zoom a:hover {
  background: #1e293b !important;
  color: #f1f5f9 !important;
}
.leaflet-control-attribution {
  background: rgba(8,14,26,0.75) !important;
  color: #475569 !important;
  font-size: 9px !important;
}
.leaflet-control-attribution a { color: #64748b !important; }
.marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
  background-color: rgba(11,144,228,0.18) !important;
}
.marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
  background-color: rgba(11,144,228,0.82) !important;
  color: #fff !important; font-weight: 700 !important;
}
`

// Wait for global L to be available (CDN scripts load asynchronously)
function waitForLeaflet(cb: (L: any) => void, attempts = 0) {
  if (typeof window !== 'undefined' && (window as any).L) {
    cb((window as any).L)
  } else if (attempts < 40) {
    setTimeout(() => waitForLeaflet(cb, attempts + 1), 150)
  } else {
    console.error('Leaflet failed to load from CDN after 6 seconds')
  }
}

export function MapSection({ stories, countryStats }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const clusterRef    = useRef<any>(null)
  const heatRef       = useRef<any>(null)

  const [selectedStory,  setSelectedStory]  = useState<MapStory | null>(null)
  const [viewMode,       setViewMode]        = useState<ViewMode>('points')
  const [activeCategory, setActiveCategory]  = useState<StoryCategory | 'all'>('all')
  const [isLocating,     setIsLocating]      = useState(false)
  const [mapReady,       setMapReady]        = useState(false)
  const [liveStories,    setLiveStories]     = useState<MapStory[]>(
    Array.isArray(stories) ? stories : []
  )

  // Fetch stories from API if none passed as props
  useEffect(() => {
    const safe = Array.isArray(stories) ? stories : []
    if (safe.length > 0) { setLiveStories(safe); return }
    fetch('/api/stories?view=map')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setLiveStories(data) })
      .catch(() => {})
  }, [stories])

  const filteredStories = activeCategory === 'all'
    ? liveStories
    : liveStories.filter(s => s.category === activeCategory)

  // Inject ping CSS once
  useEffect(() => {
    if (document.getElementById('cs-css')) return
    const el = document.createElement('style')
    el.id = 'cs-css'
    el.textContent = PING_CSS
    document.head.appendChild(el)
  }, [])

  // Initialize map once Leaflet CDN script is ready
  useEffect(() => {
    if (!containerRef.current) return

    waitForLeaflet((L) => {
      if (mapRef.current) return // already initialized

      // Fix Next.js asset path issue with default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current, {
        zoomControl: false,
        preferCanvas: true,
      }).setView([20, 10], 2)

      // CARTO dark tiles — no API key required
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© <a href="https://carto.com/">CARTO</a> © <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Marker cluster — available on global L after CDN load
      const cluster = L.markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 12,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      })

      map.addLayer(cluster)
      mapRef.current   = map
      clusterRef.current = cluster
      setMapReady(true)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current   = null
        clusterRef.current = null
        heatRef.current  = null
      }
    }
  }, [])

  // Place markers whenever stories or filter changes
  useEffect(() => {
    const L = (window as any).L
    if (!mapReady || !mapRef.current || !clusterRef.current || !L) return

    const cluster = clusterRef.current
    cluster.clearLayers()

    filteredStories.forEach((story) => {
      const color = CATEGORY_COLORS[story.category as StoryCategory] ?? '#0b90e4'
      const icon = L.divIcon({
        html: `<div class="cs-wrap" style="--mc:${color}">
          <div class="cs-ring"></div>
          <div class="cs-ring cs-ring-2"></div>
          <div class="cs-dot" style="animation-delay:${(Math.random()*3).toFixed(2)}s"></div>
        </div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      const marker = L.marker([story.latitude, story.longitude], { icon })
      marker.on('click', () => {
        setSelectedStory(story)
        mapRef.current.flyTo(
          [story.latitude, story.longitude],
          Math.max(mapRef.current.getZoom(), 5),
          { duration: 0.8 }
        )
      })
      cluster.addLayer(marker)
    })
  }, [mapReady, filteredStories])

  // Heatmap toggle
  useEffect(() => {
    const L = (window as any).L
    if (!mapReady || !mapRef.current || !L) return
    const map = mapRef.current

    if (viewMode === 'heatmap') {
      if (!heatRef.current && L.heatLayer) {
        const pts = filteredStories.map(s => [s.latitude, s.longitude, 0.6])
        heatRef.current = L.heatLayer(pts, {
          radius: 28, blur: 18, maxZoom: 10,
          gradient: { 0.2: '#0b90e4', 0.5: '#38bdf8', 0.8: '#7dd3fc', 1.0: '#e0f2fe' },
        }).addTo(map)
      }
      clusterRef.current?.eachLayer((m: any) => {
        const el = m.getElement?.()
        if (el) { el.style.opacity = '0.1'; el.style.pointerEvents = 'none' }
      })
    } else {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }
      clusterRef.current?.eachLayer((m: any) => {
        const el = m.getElement?.()
        if (el) { el.style.opacity = '1'; el.style.pointerEvents = 'auto' }
      })
    }
  }, [viewMode, mapReady, filteredStories])

  // Geolocation — same as Geopoly locateMe
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        mapRef.current.flyTo(
          [pos.coords.latitude, pos.coords.longitude],
          6, { duration: 1.5 }
        )
        setIsLocating(false)
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    )
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Loading spinner until L is ready */}
      {!mapReady && (
        <div className="absolute inset-0 bg-ink-950 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-ink-500 font-mono text-xs tracking-[0.3em] uppercase">Loading atlas</p>
        </div>
      )}

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #080e1a)', zIndex: 5 }} />

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MapControls
          viewMode={viewMode}
          activeCategory={activeCategory}
          onViewModeChange={setViewMode}
          onCategoryChange={setActiveCategory}
          onLocate={handleLocate}
          isLocating={isLocating}
          storyCount={filteredStories.length}
        />
      </div>

      {/* Story popup */}
      {selectedStory && (
        <div style={{ position: 'relative', zIndex: 20 }}>
          <MapPopup story={selectedStory} onClose={() => setSelectedStory(null)} />
        </div>
      )}
    </div>
  )
}
