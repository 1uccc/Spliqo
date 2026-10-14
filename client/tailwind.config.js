/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Liquid Glass & Tactile Clay palette
        clay: {
          bg: '#f4f3ec',
          surface: '#ffffff',
          stone: '#edece5',
          border: '#e6e4dc',
          dark: '#18181b',
          muted: '#71717a',
          pill: '#f4f3ec',
          pillHover: '#eae8df',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.55)',
          light: 'rgba(255, 255, 255, 0.35)',
          subtle: 'rgba(255, 255, 255, 0.18)',
          border: 'rgba(255, 255, 255, 0.35)',
          dark: 'rgba(15, 23, 42, 0.45)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        // Liquid Glass shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'glass-hover': '0 16px 56px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        'glass-inset': 'inset 0 1px 3px rgba(0, 0, 0, 0.06), inset 0 -1px 0 rgba(255, 255, 255, 0.3)',
        'glass-glow': '0 0 40px -8px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        'glass-dark': '0 12px 48px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'glass-btn': '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '32px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
