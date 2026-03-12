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
        brand: {
          primary: '#2E4A6E',
          secondary: '#F5A623',
          accent: '#4CAF50',
          danger: '#E53E3E',
          bg: '#F8F9FA',
        },
      },
      fontFamily: {
        // Latin + Arabic/Persian glyphs via system stack
        sans: [
          'Inter',
          'Noto Sans Arabic',
          'Noto Sans',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      screens: {
        xs: '320px',
        sm: '480px',
        md: '768px', // RTL/LTR panel collapse breakpoint (PRD §9.3)
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
