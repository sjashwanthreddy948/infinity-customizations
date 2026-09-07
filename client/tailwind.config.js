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
        infinity: {
          blue: '#0B3A82',
          darkblue: '#082A5E',
          deepblue: '#051E44',
          gold: '#D4AF37',
          lightgold: '#F5E7B2',
          text: '#172033',
          muted: '#5A6A85',
          bg: '#FFFFFF',
          section: '#F7F9FC',
          border: '#E2E8F0',
          hover: '#F1F5F9'
        },
        brand: {
          50: '#f0f5ff',
          100: '#e0ecfe',
          200: '#bad4fd',
          300: '#7cb2fb',
          400: '#388cf7',
          500: '#0B3A82',
          600: '#082A5E',
          700: '#062048',
          800: '#051A3A',
          900: '#04142E',
          950: '#020B1B'
        },
        gold: {
          50: '#fdfbf2',
          100: '#FAF4DC',
          200: '#F5E7B2',
          300: '#EBD47C',
          400: '#E2C24E',
          500: '#D4AF37',
          600: '#B89327',
          700: '#91721C',
          800: '#6E5517',
          900: '#4C3A10'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(11, 58, 130, 0.06), 0 8px 10px -6px rgba(11, 58, 130, 0.04)',
        'gold-glow': '0 0 20px -3px rgba(212, 175, 55, 0.3)',
        'blue-glow': '0 0 20px -3px rgba(11, 58, 130, 0.25)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
      }
    },
  },
  plugins: [],
}
