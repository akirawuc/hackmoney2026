import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ec',
          100: '#fdecc9',
          200: '#fbd78e',
          300: '#f9bc53',
          400: '#f7a328',
          500: '#f08a0f',
          600: '#d4650a',
          700: '#b0450c',
          800: '#8f3610',
          900: '#762e10',
        },
        dark: {
          100: '#1e293b',
          200: '#0f172a',
          300: '#020617',
        },
      },
    },
  },
  plugins: [],
};
export default config;
