'use client'
// components/map/LocationPicker.tsx — uses global window.L from CDN
import { useRef, useEffect } from 'react'

interface Props {
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
}

function waitForLeaflet(cb: (L: any) => void, attempts = 0) {
  if (typeof window !== 'undefined' && (window as any).L) {
    cb((window as any).L)
  } else if (attempts < 40) {
    setTimeout(() => waitForLeaflet(cb, attempts + 1), 150)
  }
}

export default function LocationPicker({ lat, lng, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const markerRef    = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    waitForLeaflet((L) => {
      if (mapRef.current) return
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current, { zoomControl: true }).setView([20, 10], 2)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO © OSM', subdomains: 'abcd', maxZoom: 19,
      }).addTo(map)

      const dotIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#0b90e4;border:2px solid #fff;box-shadow:0 0 8px #0b90e4"></div>`,
        className: '', iconSize: [14, 14], iconAnchor: [7, 7],
      })

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.marker([lat, lng], { icon: dotIcon }).addTo(map)
        onPick(lat, lng)
      })

      mapRef.current = map
    })
    return () => { mapRef.current?.remove(); mapRef.current = null; markerRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!map || !lat || !lng || !L) return
    map.flyTo([lat, lng], 8, { duration: 0.8 })
    const dotIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#0b90e4;border:2px solid #fff;box-shadow:0 0 8px #0b90e4"></div>`,
      className: '', iconSize: [14, 14], iconAnchor: [7, 7],
    })
    if (markerRef.current) markerRef.current.setLatLng([lat, lng])
    else markerRef.current = L.marker([lat, lng], { icon: dotIcon }).addTo(map)
  }, [lat, lng])

  return <div ref={containerRef} className="w-full h-full" />
}
