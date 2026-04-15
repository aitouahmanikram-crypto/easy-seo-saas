import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c1d3ff',
          300: '#a2bdff',
          400: '#83a7ff',
          500: '#4f46e5', // Primary blue/purple from screenshot
          600: '#4338ca',
          700: '#3730a3',
          800: '#1e1b4b',
          900: '#0f172a', // Dark background
        },
      },
    },
  },
  plugins: [],
};
export default config;
