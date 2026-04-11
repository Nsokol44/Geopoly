// components/ui/SiteFooter.tsx
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-7 h-7 flex-shrink-0">
                <div className="absolute inset-0 border-2 border-brand-400" />
                <div className="absolute inset-[3px] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0b90e4, #0369a1)' }}>
                  <span className="font-display font-bold text-white text-[9px]">G</span>
                </div>
              </div>
              <div>
                <span className="font-display text-sm text-ink-50 font-bold">Geopoly</span>
                <span className="font-mono text-[9px] text-ink-500 tracking-widest uppercase ml-2">Climate Stories</span>
              </div>
            </div>
            <p className="text-ink-500 text-sm leading-relaxed">
              A joint initiative of National Geographic Society and The Climate Pledge —
              illuminating climate resilience and solutions around the world.
            </p>
          </div>

          {/* Explore links */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-ink-400 mb-4">Explore</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'World Map' },
                { href: '/stories', label: 'All Stories' },
                { href: '/submit', label: 'Submit a Story' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-500 hover:text-ink-200 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-mono text-xs tracking-[0.2em] uppercase text-ink-400 mb-4">Categories</h4>
            <ul className="space-y-2">
              {[
                { href: '/stories?category=energy_transition', label: 'Energy Transition',    color: '#0b90e4' },
                { href: '/stories?category=nature_land',       label: 'Nature & Land',         color: '#22c55e' },
                { href: '/stories?category=built_human',       label: 'Built & Human Systems', color: '#38bdf8' },
                { href: '/stories?category=extreme_weather',   label: 'Extreme Weather',       color: '#f87171' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center gap-2 text-ink-500 hover:text-ink-200 text-sm transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ink-600 text-xs font-mono">
            © {new Date().getFullYear()} Geopoly · National Geographic Society × The Climate Pledge
          </p>
          <p className="text-ink-600 text-xs font-mono">
            Map data © OpenStreetMap contributors · © CARTO
          </p>
        </div>
      </div>
    </footer>
  )
}
