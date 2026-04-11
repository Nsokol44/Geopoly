/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // Primary accent — ocean blue
        brand: {
          50:  '#eff8ff',
          100: '#dbeffe',
          200: '#b0dffd',
          300: '#6ec8fb',
          400: '#35adf6',
          500: '#0b90e4',
          600: '#0071c2',
          700: '#015a9d',
          800: '#064d82',
          900: '#0a406c',
          950: '#072947',
        },
        // Secondary accent — forest green
        nature: {
          50:  '#f0fdf5',
          100: '#dcfce9',
          200: '#bbf7d2',
          300: '#86efb0',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Neutral slate — replaces warm ink
        ink: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#080e1a',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'var(--font-body)',
            color: '#1c1812',
            h1: { fontFamily: 'var(--font-display)' },
            h2: { fontFamily: 'var(--font-display)' },
            h3: { fontFamily: 'var(--font-display)' },
          },
        },
      },
    },
  },
  plugins: [],
}
