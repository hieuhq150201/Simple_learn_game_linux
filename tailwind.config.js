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
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        'star-pop': {
          '0%': { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '70%': { transform: 'scale(1.25) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'streak-break': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '30%': { transform: 'scale(1.15)' },
          '60%': { transform: 'scale(0.8) rotate(10deg)', opacity: '0.6' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        'celebrate-in': 'celebrate-in 0.35s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'star-pop': 'star-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'streak-break': 'streak-break 0.6s ease-in forwards',
      },
    },
  },
  plugins: [],
};
