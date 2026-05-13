/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#166534',
          600: '#15803d',
          700: '#14532d',
          800: '#052e16',
          900: '#022c22',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#d4a017',
          600: '#b8860b',
          700: '#92400e',
        },
        islamic: {
          green: '#1a5e3a',
          darkGreen: '#0d3320',
          gold: '#d4a017',
          cream: '#fef9ef',
          dark: '#1a1a2e',
          darker: '#0f0f1a',
        }
      },
      fontFamily: {
        urdu: ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'serif'],
        arabic: ['Amiri', 'Traditional Arabic', 'serif'],
      },
    },
  },
  plugins: [],
};
