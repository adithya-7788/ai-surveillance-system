/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#90b6ff',
          400: '#5f91ff',
          500: '#3b6eff',
          600: '#244ff4',
          700: '#1f3edb',
          800: '#2237b1',
          900: '#223686',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};
