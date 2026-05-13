/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ink:   '#0a0a0f',
        cream: '#f5f3f0',
        warm:  '#ebe7e1',
        brand: {
          50:  '#eef2ff',
          100: '#dde6ff',
          200: '#beccff',
          300: '#8aaaff',
          400: '#527bff',
          500: '#2d57ff',
          600: '#1a4fff',
          700: '#1440cc',
          800: '#1232a0',
          900: '#102880',
          950: '#0a0a0f',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'SF Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
