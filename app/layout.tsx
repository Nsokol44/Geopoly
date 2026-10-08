import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JustGimmeADolla — Real Stories. Real People.',
  description: 'Voice stories from real people. If it moves you — send a dollar.',
  openGraph: {
    title: 'JustGimmeADolla',
    description: 'Real stories. Real people. If it moves you — send a dollar.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet — loaded as global scripts, same as the original Geopoly theme.
            The map components use the global L (no npm import). */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer></script>

        {/* MarkerCluster — must load AFTER Leaflet, uses global L */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" defer></script>

        {/* Leaflet.heat for the heatmap toggle */}
        <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js" defer></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
