/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        admin: {
          sidebar: '#0F172A', // Slate 900
          sidebarHover: '#1E293B',
          primary: '#10B981',
          accent: '#F97316',
        },
      },
      fontFamily: {
        bangla: ['Hind Siliguri', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
