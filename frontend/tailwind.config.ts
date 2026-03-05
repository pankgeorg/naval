import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maritime: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#b9dfff',
          300: '#7cc4ff',
          400: '#36a5ff',
          500: '#0c87f2',
          600: '#006acf',
          700: '#0054a8',
          800: '#04478a',
          900: '#0a3c72',
          950: '#07264b',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
