/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f9',
          100: '#e1e9f2',
          200: '#c3d3e6',
          300: '#94b3d3',
          400: '#5f8ebd',
          500: '#3b70a5',
          600: '#2c5888',
          700: '#24476f',
          800: '#1d3c5c',
          900: '#19334e',
          950: '#0f2033',
        },
        navy: {
          800: '#0B192C',
          900: '#06101E',
          950: '#030810',
        },
        gov: {
          blue: '#1A365D',
          dark: '#0F172A',
          gold: '#C59B27',
          teal: '#0D9488',
          emerald: '#059669',
          crimson: '#BE123C',
          amber: '#D97706',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
