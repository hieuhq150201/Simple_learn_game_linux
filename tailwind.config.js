/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/app/**/*.{ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        term: {
          bg: '#030712',
          green: '#4ade80',
          red: '#f87171',
          yellow: '#facc15',
          accent: '#818cf8',
          border: '#1f2937',
        },
        hp: {
          surface: 'var(--hp-surface)',
          card:    'var(--hp-card)',
          border:  'var(--hp-border)',
          fg:      'var(--hp-fg)',
          muted:   'var(--hp-muted)',
          subtle:  'var(--hp-subtle)',
        },
      },
      fontFamily: {
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        blink: { '0%, 50%': { opacity: '1' }, '50.01%, 100%': { opacity: '0' } },
        'celebrate-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        'celebrate-in': 'celebrate-in 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
